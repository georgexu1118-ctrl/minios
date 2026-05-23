export const runtime = "edge"; // zero cold-start, instant streaming, global CDN

import { NextRequest } from "next/server";
import OpenAI from "openai";

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------
// Yahoo Finance v8 chart endpoint — works without auth/cookies (unlike v7 quote).
// Returns meta block with current price, 52w high/low, day range, and a YTD time-series
// from which we compute YTD %.
async function getStock(symbol: string): Promise<Record<string, unknown>> {
  symbol = (symbol ?? "").trim().toUpperCase();
  if (!symbol) return { error: "no symbol given" };

  const fetchChart = async (range: string, interval: string) => {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json() as Promise<{
      chart?: {
        result?: Array<{
          meta?: Record<string, unknown> & {
            regularMarketPrice?: number;
            chartPreviousClose?: number;
            previousClose?: number;
            currency?: string;
            symbol?: string;
            exchangeName?: string;
            longName?: string;
            shortName?: string;
            fiftyTwoWeekHigh?: number;
            fiftyTwoWeekLow?: number;
            regularMarketDayHigh?: number;
            regularMarketDayLow?: number;
            regularMarketVolume?: number;
          };
          timestamp?: number[];
          indicators?: { quote?: Array<{ close?: (number | null)[]; open?: (number | null)[] }> };
        }>;
        error?: { code?: string; description?: string };
      };
    }>;
  };

  try {
    // 1-day chart for current price + day range
    const day = await fetchChart("1d", "5m");
    const dayResult = day?.chart?.result?.[0];
    if (!dayResult) {
      const code = day?.chart?.error?.code ?? "unknown";
      return { error: `no data for "${symbol}" (${code})` };
    }
    const meta = dayResult.meta ?? {};
    const last = meta.regularMarketPrice;
    const prev = meta.chartPreviousClose ?? meta.previousClose;

    // YTD chart to compute year-to-date %
    let ytdPct: number | undefined;
    const ytd = await fetchChart("ytd", "1d");
    const ytdPoints = ytd?.chart?.result?.[0];
    if (ytdPoints?.indicators?.quote?.[0]?.close && ytdPoints.timestamp?.length) {
      const closes = (ytdPoints.indicators.quote[0].close ?? []).filter(c => typeof c === "number") as number[];
      if (closes.length > 1 && last) {
        ytdPct = +(((last - closes[0]) / closes[0]) * 100).toFixed(2);
      }
    }

    const change = (last != null && prev != null) ? +(last - prev).toFixed(2) : undefined;
    const changePct = (last != null && prev) ? +(((last - prev) / prev) * 100).toFixed(2) : undefined;

    // Open from first 5m bar of the session
    const openArr = dayResult.indicators?.quote?.[0]?.open ?? [];
    const open = openArr.find(v => typeof v === "number") ?? undefined;

    return {
      symbol: meta.symbol ?? symbol,
      name: meta.longName ?? meta.shortName,
      exchange: meta.exchangeName,
      currency: meta.currency,
      last_price: last,
      previous_close: prev,
      open,
      change,
      change_pct: changePct,
      day_high: meta.regularMarketDayHigh,
      day_low: meta.regularMarketDayLow,
      year_high: meta.fiftyTwoWeekHigh,
      year_low: meta.fiftyTwoWeekLow,
      volume: meta.regularMarketVolume,
      ytd_pct: ytdPct,
      source: "yahoo finance v8 chart",
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
// Model registry — general-purpose vs educational
// ---------------------------------------------------------------------------
// "gpt-4o-mini"  → OpenAI proprietary, general-purpose, fastest, cheapest
// "gpt-oss-20b"  → OpenAI open-weight model on Together AI; tuned via prompt
//                  for educational use (school work, study, flashcards)
const MODELS: Record<string, { apiKeyEnv: string; baseURL?: string; modelId: string; mode: "general" | "educational" }> = {
  "gpt-4o-mini": {
    apiKeyEnv: "OPENAI_API_KEY",
    modelId: "gpt-4o-mini",
    mode: "general",
  },
  "gpt-oss-20b": {
    apiKeyEnv: "TOGETHER_API_KEY",
    baseURL: "https://api.together.xyz/v1",
    modelId: "openai/gpt-oss-20b",
    mode: "educational",
  },
};

const SYSTEM_PROMPT_EDU =
  "You are AAOS Study — an educational tutor running on the AAOS Autonomous AI OS. " +
  "Specialize in school subjects: math, biology, chemistry, physics, history, literature, computer science. " +
  "Explain step by step, define terms, and check understanding. " +
  "When the student asks a homework-style question, walk them through the reasoning instead of just giving the final answer. " +
  "Be concise, accurate, and patient. Prefer numbered steps and short examples. " +
  "When asked for flashcards, suggest the user click the Flashcards button for a structured set.";

const SYSTEM_PROMPT_FLASHCARDS =
  "You are an exam-prep flashcard generator. " +
  "Output ONLY a valid JSON array — no markdown, no code fences, no preamble, no commentary. " +
  "Schema: [{\"front\":\"question or term\",\"back\":\"answer or definition\"}]. " +
  "Each front is one concept. Each back is 1-3 short sentences. " +
  "If the user requests a specific count, produce exactly that many cards.";

// ---------------------------------------------------------------------------
// POST /api/chat  — streaming SSE
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const body = await req.json() as {
    messages: { role: string; content: string }[];
    model?: string;
    mode?: "flashcards";
  };

  // Flashcard mode forces the open-weight educational model and skips tools.
  const isFlashcards = body.mode === "flashcards";
  const requested = isFlashcards ? "gpt-oss-20b" : (body.model ?? "gpt-4o-mini");
  const config = MODELS[requested] ?? MODELS["gpt-4o-mini"];

  const apiKey = process.env[config.apiKeyEnv];
  if (!apiKey) {
    const friendlyMap: Record<string, string> = {
      "TOGETHER_API_KEY": "gpt-oss-20b requires TOGETHER_API_KEY in environment. Switch to gpt-4o-mini or add the key in Vercel.",
    };
    const friendly = friendlyMap[config.apiKeyEnv] ?? `${config.apiKeyEnv} not configured`;
    return new Response(JSON.stringify({ error: friendly }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }

  const model = config.modelId;
  const openai = new OpenAI({ apiKey, baseURL: config.baseURL });
  const sysPrompt = isFlashcards
    ? SYSTEM_PROMPT_FLASHCARDS
    : config.mode === "educational" ? SYSTEM_PROMPT_EDU
    : SYSTEM_PROMPT;
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: sysPrompt },
    ...(body.messages ?? []).map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(obj: Record<string, unknown>) {
        controller.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`));
      }

      try {
        // ── FLASHCARD MODE ───────────────────────────────────────────
        // Collect full JSON output, parse, emit one "flashcards" event.
        if (isFlashcards) {
          const completion = await openai.chat.completions.create({
            model, messages, temperature: 0.5, max_tokens: 1500, stream: false,
          });
          const raw = completion.choices[0]?.message?.content ?? "";

          // Strip code fences / preamble if the model added them anyway
          let jsonStr = raw.trim();
          const fence = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (fence) jsonStr = fence[1].trim();
          const firstBracket = jsonStr.indexOf("[");
          const lastBracket  = jsonStr.lastIndexOf("]");
          if (firstBracket >= 0 && lastBracket > firstBracket) {
            jsonStr = jsonStr.slice(firstBracket, lastBracket + 1);
          }

          let cards: { front: string; back: string }[] = [];
          try {
            const parsed = JSON.parse(jsonStr);
            if (Array.isArray(parsed)) {
              cards = parsed
                .filter(c => c && typeof c.front === "string" && typeof c.back === "string")
                .map(c => ({ front: String(c.front).trim(), back: String(c.back).trim() }));
            }
          } catch {
            send({ type: "error", message: "Could not parse flashcards JSON. Raw: " + raw.slice(0, 200) });
            return;
          }

          if (!cards.length) {
            send({ type: "error", message: "Model returned no valid flashcards." });
            return;
          }

          send({ type: "flashcards", cards });
          send({ type: "done", text: `${cards.length} flashcards generated.` });
          return;
        }

        // ── REGULAR CHAT MODE ────────────────────────────────────────
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
