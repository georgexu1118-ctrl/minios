export const runtime = "edge"; // zero cold-start, instant streaming, global CDN

import { NextRequest } from "next/server";
import OpenAI from "openai";

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------
async function getStock(symbol: string): Promise<Record<string, unknown>> {
  symbol = (symbol ?? "").trim().toUpperCase();
  if (!symbol) return { error: "no symbol given" };
  try {
    // Use Yahoo Finance v7 quote endpoint directly — avoids module typing issues
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
    });
    const data = await res.json() as {
      quoteResponse?: {
        result?: Array<Record<string, unknown>>;
        error?: unknown;
      };
    };
    const r = data?.quoteResponse?.result?.[0];
    if (!r) return { error: `no data for "${symbol}"` };
    const last = r.regularMarketPrice as number | undefined;
    const prev = r.regularMarketPreviousClose as number | undefined;
    return {
      symbol,
      currency: r.currency,
      last_price: last,
      previous_close: prev,
      open: r.regularMarketOpen,
      day_high: r.regularMarketDayHigh,
      day_low: r.regularMarketDayLow,
      year_high: r.fiftyTwoWeekHigh,
      year_low: r.fiftyTwoWeekLow,
      change: r.regularMarketChange,
      change_pct: typeof r.regularMarketChangePercent === "number"
        ? +((r.regularMarketChangePercent as number) * 100).toFixed(2)
        : undefined,
      market_cap: r.marketCap,
      short_name: r.shortName,
      long_name: r.longName,
      trailing_pe: r.trailingPE,
    };
  } catch (e) {
    return { error: String(e) };
  }
}

async function webSearch(query: string): Promise<Record<string, unknown>> {
  query = (query ?? "").trim();
  if (!query) return { error: "empty query" };
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(url, { headers: { "User-Agent": "AAOS-Research/1.0" }, next: { revalidate: 0 } });
    const data = await res.json() as {
      Abstract?: string;
      AbstractURL?: string;
      AbstractSource?: string;
      RelatedTopics?: Array<{ Text?: string; FirstURL?: string; Name?: string; Topics?: Array<{ Text?: string; FirstURL?: string }> }>;
      Answer?: string;
    };

    const results: { title: string; url: string; snippet: string }[] = [];

    if (data.Answer) {
      results.push({ title: "Direct Answer", url: "", snippet: data.Answer });
    }
    if (data.Abstract && data.AbstractURL) {
      results.push({ title: data.AbstractSource ?? "Summary", url: data.AbstractURL, snippet: data.Abstract.slice(0, 400) });
    }
    for (const t of data.RelatedTopics ?? []) {
      if (results.length >= 5) break;
      if (t.Text && t.FirstURL) {
        results.push({ title: t.Text.slice(0, 80), url: t.FirstURL, snippet: t.Text.slice(0, 300) });
      }
      for (const sub of t.Topics ?? []) {
        if (results.length >= 5) break;
        if (sub.Text && sub.FirstURL) {
          results.push({ title: sub.Text.slice(0, 80), url: sub.FirstURL, snippet: sub.Text.slice(0, 300) });
        }
      }
    }

    if (!results.length) return { error: `no results for "${query}"` };
    return { query, results };
  } catch (e) {
    return { error: String(e) };
  }
}

// ---------------------------------------------------------------------------
// Tool schemas
// ---------------------------------------------------------------------------
const TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_stock",
      description: "Get live quote and stats for a US-listed stock ticker (AAPL, MSFT, TSLA, AAOI…).",
      parameters: {
        type: "object",
        properties: { symbol: { type: "string", description: "Ticker symbol" } },
        required: ["symbol"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web for current events, recent news, or post-training-cutoff information.",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "search query" } },
        required: ["query"],
      },
    },
  },
];

const SYSTEM_PROMPT =
  "You are AAOS — the Autonomous AI OS — an advanced intelligence running on a custom " +
  "32-bit OS kernel built from scratch. You have the precision of a spacecraft navigation " +
  "system and the curiosity of an explorer beyond the known universe. " +
  "Use get_stock for US stock questions (live Yahoo Finance data). " +
  "Use web_search for current events, recent news, or anything beyond your training cutoff. " +
  "Answer general knowledge from your own training without searching. " +
  "Be concise, accurate, and confident. Prefer bullet points for multi-part answers.";

// ---------------------------------------------------------------------------
// POST /api/chat  — streaming SSE
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }

  const body = await req.json() as { messages: { role: string; content: string }[]; model?: string };
  const model = body.model ?? "gpt-4o-mini";

  const openai = new OpenAI({ apiKey });
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...(body.messages ?? []).map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(obj: Record<string, unknown>) {
        controller.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`));
      }

      try {
        for (let round = 0; round < 4; round++) {
          const chunks = await openai.chat.completions.create({
            model, messages, tools: TOOLS, temperature: 0.4, max_tokens: 600, stream: true,
          });

          let content = "";
          let finishReason = "";
          const toolCalls: Record<number, { id: string; name: string; args: string }> = {};

          for await (const chunk of chunks) {
            const delta = chunk.choices[0]?.delta;
            if (!delta) continue;
            finishReason = chunk.choices[0]?.finish_reason ?? finishReason;

            if (delta.content) {
              content += delta.content;
              send({ type: "text", text: delta.content });
            }

            for (const tc of delta.tool_calls ?? []) {
              const i = tc.index;
              if (!toolCalls[i]) toolCalls[i] = { id: "", name: "", args: "" };
              if (tc.id) toolCalls[i].id = tc.id;
              if (tc.function?.name) toolCalls[i].name += tc.function.name;
              if (tc.function?.arguments) toolCalls[i].args += tc.function.arguments;
            }
          }

          const tcList = Object.values(toolCalls);
          if (!tcList.length || finishReason === "stop") {
            send({ type: "done", text: content });
            break;
          }

          // Execute tools
          const assistantMsg: OpenAI.Chat.ChatCompletionMessageParam = {
            role: "assistant",
            content: content || null,
            tool_calls: tcList.map(tc => ({
              id: tc.id, type: "function" as const,
              function: { name: tc.name, arguments: tc.args },
            })),
          };
          messages.push(assistantMsg);

          for (const tc of tcList) {
            let args: Record<string, string> = {};
            try { args = JSON.parse(tc.args || "{}"); } catch { /* bad json */ }

            send({ type: "tool_call", tool: tc.name, args });

            let result: Record<string, unknown>;
            if (tc.name === "get_stock") result = await getStock(args.symbol ?? "");
            else if (tc.name === "web_search") result = await webSearch(args.query ?? "");
            else result = { error: `unknown tool ${tc.name}` };

            send({ type: "tool_result", tool: tc.name, result });
            messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result) });
          }
        }
      } catch (e) {
        send({ type: "error", message: String(e) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
