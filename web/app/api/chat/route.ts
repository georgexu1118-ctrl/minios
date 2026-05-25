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

// Tiny RSS item extractor — works in Edge Runtime (no DOMParser needed).
function extractTag(block: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(re);
  if (!m) return "";
  return m[1].replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, "$1").trim();
}

function parseRssItems(xml: string, limit = 6) {
  const items: { title: string; url: string; snippet: string; date?: string; source?: string }[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null && items.length < limit) {
    const block = m[1];
    const title = extractTag(block, "title");
    const link = extractTag(block, "link");
    if (!title || !link) continue;
    const pubDate = extractTag(block, "pubDate");
    const source = extractTag(block, "source");
    const description = extractTag(block, "description")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();
    items.push({
      title: title.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
      url: link,
      snippet: description.slice(0, 280),
      date: pubDate || undefined,
      source: source || undefined,
    });
  }
  return items;
}

// Real news via Google News RSS (no API key, no auth). Returns fresh headlines
// with publish dates and source publications — what the model was missing.
async function googleNews(query: string) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; AAOS-Research/1.0)" },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const xml = await res.text();
  return parseRssItems(xml, 6);
}

// DuckDuckGo Instant Answer — good for non-news factual lookups (definitions,
// people, etc.) but useless for news. Kept as fallback.
async function duckDuckGo(query: string) {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
  const res = await fetch(url, { headers: { "User-Agent": "AAOS-Research/1.0" }, cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json() as {
    Abstract?: string;
    AbstractURL?: string;
    AbstractSource?: string;
    RelatedTopics?: Array<{ Text?: string; FirstURL?: string; Topics?: Array<{ Text?: string; FirstURL?: string }> }>;
    Answer?: string;
  };
  const results: { title: string; url: string; snippet: string }[] = [];
  if (data.Answer) results.push({ title: "Direct Answer", url: "", snippet: data.Answer });
  if (data.Abstract && data.AbstractURL)
    results.push({ title: data.AbstractSource ?? "Summary", url: data.AbstractURL, snippet: data.Abstract.slice(0, 400) });
  for (const t of data.RelatedTopics ?? []) {
    if (results.length >= 5) break;
    if (t.Text && t.FirstURL) results.push({ title: t.Text.slice(0, 80), url: t.FirstURL, snippet: t.Text.slice(0, 280) });
    for (const sub of t.Topics ?? []) {
      if (results.length >= 5) break;
      if (sub.Text && sub.FirstURL) results.push({ title: sub.Text.slice(0, 80), url: sub.FirstURL, snippet: sub.Text.slice(0, 280) });
    }
  }
  return results;
}

async function webSearch(query: string): Promise<Record<string, unknown>> {
  query = (query ?? "").trim();
  if (!query) return { error: "empty query" };

  // 1) Always try Google News RSS first — fresh headlines, real publishers, real dates.
  try {
    const news = await googleNews(query);
    if (news.length) return { query, source: "google news", results: news };
  } catch { /* fall through */ }

  // 2) Fallback to DuckDuckGo for non-news factual queries.
  try {
    const ddg = await duckDuckGo(query);
    if (ddg.length) return { query, source: "duckduckgo", results: ddg };
  } catch { /* fall through */ }

  return { error: `no results for "${query}"` };
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
      description: "Search the live web for current events, today's headlines, recent news, breaking stories, " +
        "or anything that may have changed after your training cutoff. Returns real news articles from publishers " +
        "(NYT, Reuters, Bloomberg, BBC, TechCrunch, etc.) via Google News, with publish dates and source names. " +
        "ALWAYS use this tool when the user asks about news, latest, today, this week, or recent events.",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "search query — be specific (e.g. 'OpenAI news today', 'AI regulation 2026')" } },
        required: ["query"],
      },
    },
  },
];

const SYSTEM_PROMPT =
  "You are AAOS — the Autonomous AI OS — an advanced intelligence running on a custom " +
  "32-bit OS kernel built from scratch. " +
  "Use get_stock for US stock questions (live Yahoo Finance data). " +
  "ALWAYS call web_search for ANY question about: current events, today's news, latest news, " +
  "what's happening, recent announcements, this week, this month, this year, or anything that " +
  "could have changed after your training cutoff. NEVER respond with 'I cannot retrieve news' or " +
  "similar disclaimers — you have web_search available. Call it. When web_search returns results, " +
  "summarize them naturally with the source publication name and date for each story. " +
  "Answer general/timeless knowledge from your own training without searching. " +
  "Be concise, accurate, and confident. Prefer bullet points for multi-part answers.";

// ---------------------------------------------------------------------------
// Provider chains — ordered by speed/quality preference.
// Each chain is tried in order; 429/503/529 triggers the next provider.
// Keys live only in Vercel encrypted env — never committed to code.
// ---------------------------------------------------------------------------
type ProviderConfig = {
  apiKeyEnv: string;
  baseURL?: string;
  modelId: string;
  mode: "general" | "educational" | "vision";
};

// Educational layer (gpt-oss-20b selected): Groq LPU first (fastest, 1000 tok/s), Together AI fallback.
const EDU_PROVIDERS: ProviderConfig[] = [
  // Groq LPU — confirmed live for gpt-oss-20b at ~1000 tok/s
  { apiKeyEnv: "GROQ_API_KEY",      baseURL: "https://api.groq.com/openai/v1",          modelId: "openai/gpt-oss-20b", mode: "educational" },
  // Fireworks AI fallback (add FIREWORKS_API_KEY to enable)
  { apiKeyEnv: "FIREWORKS_API_KEY", baseURL: "https://api.fireworks.ai/inference/v1",    modelId: "accounts/fireworks/models/gpt-oss-20b", mode: "educational" },
  // Together AI native gpt-oss-20b
  { apiKeyEnv: "TOGETHER_API_KEY",  baseURL: "https://api.together.xyz/v1",              modelId: "openai/gpt-oss-20b", mode: "educational" },
  // Last-resort Llama fallbacks
  { apiKeyEnv: "TOGETHER_API_KEY",  baseURL: "https://api.together.xyz/v1",              modelId: "meta-llama/Llama-4-Scout-17B-16E-Instruct", mode: "educational" },
  { apiKeyEnv: "TOGETHER_API_KEY",  baseURL: "https://api.together.xyz/v1",              modelId: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo", mode: "educational" },
];

// General layer — Kimi K2 (Moonshot AI 1T MoE) on Groq LPU. Underrated frontier model
// with insane Groq throughput (~200 tok/s on a 1T-parameter MoE).
// OPENAI_FINETUNE_MODEL env var: set to a fine-tuned model ID to swap into the OpenAI slot.
const _ftModel = process.env.OPENAI_FINETUNE_MODEL;
const GENERAL_PROVIDERS: ProviderConfig[] = [
  // Kimi K2 (Moonshot AI) on Groq LPU — 1T-parameter MoE, frontier reasoning, full tool use
  { apiKeyEnv: "GROQ_API_KEY",      baseURL: "https://api.groq.com/openai/v1",       modelId: "moonshotai/kimi-k2-instruct-0905",               mode: "general" },
  // Groq Llama 3.3 70B fallback — 280 tok/s
  { apiKeyEnv: "GROQ_API_KEY",      baseURL: "https://api.groq.com/openai/v1",       modelId: "llama-3.3-70b-versatile",                        mode: "general" },
  // OpenAI fine-tuned (when available) or gpt-4o-mini
  { apiKeyEnv: "OPENAI_API_KEY",    modelId: _ftModel ?? "gpt-4o-mini",              mode: "general" },
  // Together AI fallbacks
  { apiKeyEnv: "TOGETHER_API_KEY",  baseURL: "https://api.together.xyz/v1",          modelId: "meta-llama/Llama-4-Scout-17B-16E-Instruct",      mode: "general" },
  { apiKeyEnv: "TOGETHER_API_KEY",  baseURL: "https://api.together.xyz/v1",          modelId: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",   mode: "general" },
];

// Vision layer: Groq LPU first (fastest), Together AI fallback.
const VISION_PROVIDERS: ProviderConfig[] = [
  { apiKeyEnv: "GROQ_API_KEY",    baseURL: "https://api.groq.com/openai/v1", modelId: "meta-llama/llama-4-scout-17b-16e-instruct", mode: "vision" },
  { apiKeyEnv: "TOGETHER_API_KEY", baseURL: "https://api.together.xyz/v1", modelId: "meta-llama/Llama-4-Scout-17B-16E-Instruct", mode: "vision" },
];

function resolveProviderChain(requested: string, hasImage: boolean): ProviderConfig[] {
  if (hasImage && requested !== "gpt-4o-mini") return VISION_PROVIDERS;
  if (requested === "gpt-oss-20b") return EDU_PROVIDERS;
  return GENERAL_PROVIDERS;
}

function firstAvailable(chain: ProviderConfig[]): ProviderConfig | null {
  for (const p of chain) { if (process.env[p.apiKeyEnv]) return p; }
  return null;
}

// Try each provider in order; skip on rate-limit / overload errors.
async function streamWithFallbacks(
  chain: ProviderConfig[],
  params: {
    messages: OpenAI.Chat.ChatCompletionMessageParam[];
    tools?: OpenAI.Chat.ChatCompletionTool[];
    temperature?: number;
    max_tokens?: number;
  }
): Promise<{ chunks: AsyncIterable<OpenAI.Chat.ChatCompletionChunk>; client: OpenAI; modelId: string }> {
  const errs: string[] = [];
  for (const provider of chain) {
    const key = process.env[provider.apiKeyEnv];
    if (!key) continue;
    const client = new OpenAI({ apiKey: key, baseURL: provider.baseURL });
    try {
      const chunks = await client.chat.completions.create({
        model: provider.modelId, stream: true, ...params,
      });
      return { chunks, client, modelId: provider.modelId };
    } catch (e: unknown) {
      const status = (e as { status?: number })?.status;
      // Skip on rate-limit, overload, server-error, AND bad-request/not-found
      // (so a missing or renamed model gracefully falls to the next provider).
      if (status === 400 || status === 404 || status === 422 ||
          status === 429 || status === 500 || status === 503 || status === 529) {
        const msg = (e as { message?: string })?.message?.slice(0, 80) ?? "";
        errs.push(`${provider.modelId}:${status}${msg ? ` (${msg})` : ""}`);
        console.warn(`[chat] provider ${provider.modelId} failed: ${status} ${msg}`);
        continue;
      }
      throw e;
    }
  }
  throw new Error(`All providers unavailable (${errs.join(", ")})`);
}

async function completeWithFallbacks(
  chain: ProviderConfig[],
  params: {
    messages: OpenAI.Chat.ChatCompletionMessageParam[];
    temperature?: number;
    max_tokens?: number;
  }
): Promise<OpenAI.Chat.ChatCompletion> {
  const errs: string[] = [];
  for (const provider of chain) {
    const key = process.env[provider.apiKeyEnv];
    if (!key) continue;
    const client = new OpenAI({ apiKey: key, baseURL: provider.baseURL });
    try {
      return await client.chat.completions.create({
        model: provider.modelId, stream: false, ...params,
      });
    } catch (e: unknown) {
      const status = (e as { status?: number })?.status;
      // Skip on rate-limit, overload, server-error, AND bad-request/not-found
      // (so a missing or renamed model gracefully falls to the next provider).
      if (status === 400 || status === 404 || status === 422 ||
          status === 429 || status === 500 || status === 503 || status === 529) {
        const msg = (e as { message?: string })?.message?.slice(0, 80) ?? "";
        errs.push(`${provider.modelId}:${status}${msg ? ` (${msg})` : ""}`);
        console.warn(`[chat] provider ${provider.modelId} failed: ${status} ${msg}`);
        continue;
      }
      throw e;
    }
  }
  throw new Error(`All providers unavailable (${errs.join(", ")})`);
}

// Deep solution-chemistry reference, injected into both EDU and VISION prompts.
// Lists the formulas the model should always have ready and the traps to check.
const CHEMISTRY_OF_SOLUTIONS = `

You are EXTREMELY STRONG at the chemistry of solutions. Always apply this knowledge correctly:

CONCENTRATION UNITS:
- Molarity M = mol solute / L solution
- Molality m = mol solute / kg solvent  (use kg of SOLVENT, not solution)
- Mole fraction x_i = n_i / Σ n_j
- Mass percent (w/w) = (mass solute / mass solution) × 100
- ppm = mg solute / kg solution; ppb = µg solute / kg solution
- Normality N = equivalents / L  (use for acid–base and redox)

COLLIGATIVE PROPERTIES (use VAN'T HOFF FACTOR i for ionic compounds: NaCl i≈2, CaCl₂ i≈3, glucose/urea i=1):
- Boiling-point elevation:  ΔT_b = i · K_b · m
- Freezing-point depression: ΔT_f = i · K_f · m
- Osmotic pressure:          Π = i · M · R · T   (R = 0.08206 L·atm/(mol·K), T in K)
- Vapor-pressure lowering (Raoult): P_solution = x_solvent · P°_solvent
- For two volatile components: P_total = x_A·P°_A + x_B·P°_B

EQUILIBRIA & ACID–BASE:
- Kw = [H⁺][OH⁻] = 1.0 × 10⁻¹⁴ at 25 °C
- pH = −log[H⁺],  pOH = −log[OH⁻],  pH + pOH = 14
- Weak acid: Ka = [H⁺][A⁻]/[HA]; pKa = −log Ka; if x ≪ C₀ then [H⁺] ≈ √(Ka·C₀)
- Henderson–Hasselbalch (buffer): pH = pKa + log([A⁻]/[HA])
- Polyprotic acids: solve stepwise with Ka1, Ka2, …; usually Ka1 dominates
- ICE tables for equilibrium problems; check the small-x approximation (valid if x/C₀ < 5%)

SOLUBILITY & PRECIPITATION:
- Ksp expression matches stoichiometry: AgCl → Ksp = [Ag⁺][Cl⁻]; CaF₂ → Ksp = [Ca²⁺][F⁻]²
- Molar solubility s: solve from Ksp; common-ion effect lowers s
- Q vs Ksp: Q < Ksp unsaturated, Q = Ksp saturated, Q > Ksp precipitates

THERMODYNAMICS OF DISSOLUTION:
- ΔG_soln = ΔH_soln − T·ΔS_soln; soluble if ΔG < 0
- Lattice energy, hydration energy, and entropy of mixing all matter

GAS SOLUBILITY:
- Henry's law: C = k_H · P_gas (or P = k_H · x), C increases with pressure, decreases with T

ELECTROCHEMISTRY OF SOLUTIONS:
- Nernst: E = E° − (RT/nF)·ln Q = E° − (0.0592/n)·log Q at 25 °C
- Galvanic cell: E°_cell = E°_cathode − E°_anode; spontaneous if E°_cell > 0
- ΔG° = −nFE°; relate to K via ΔG° = −RT·ln K

ICE TABLE CONSTRUCTION — always build one for any equilibrium problem:
Format as a markdown table with columns for each species and rows I / C / E.

RULES:
1. Write the balanced equation first: aA ⇌ bB + cC
2. Initial row: given concentrations (0 for pure products unless stated otherwise)
3. Change row: use stoichiometric ratios relative to x
   - Reactants lose: −ax, −bx …   Products gain: +bx, +cx …
   - For Ksp: the dissolving solid has no column; ions get +stoich·x
4. Equilibrium row: Initial + Change for each species
5. Substitute into the K expression and solve for x
6. Check the small-x approximation: valid if x/C₀ < 5% (skip quadratic)
7. Back-calculate requested quantity (pH, concentration, solubility, etc.)

EXAMPLE — weak acid HA, initial [HA] = C₀, Ka given:

| | [HA] | [H⁺] | [A⁻] |
|---|---|---|---|
| I | C₀ | 0 | 0 |
| C | −x | +x | +x |
| E | C₀−x | x | x |

Ka = x²/(C₀−x)  →  if x ≪ C₀: x ≈ √(Ka·C₀),  pH = −log x

EXAMPLE — polyprotic acid H₂A (use two successive ICE tables, Ka1 then Ka2):
First ICE: H₂A ⇌ H⁺ + HA⁻  (solve x₁ with Ka1, usually dominates pH)
Second ICE: HA⁻ ⇌ H⁺ + A²⁻  (Ka2 usually tiny; [H⁺] ≈ x₁ + x₂ ≈ x₁)

EXAMPLE — Ksp dissolution, e.g. Ca₃(PO₄)₂ ⇌ 3 Ca²⁺ + 2 PO₄³⁻:

| | [Ca²⁺] | [PO₄³⁻] |
|---|---|---|
| I | 0 | 0 |
| C | +3s | +2s |
| E | 3s | 2s |

Ksp = (3s)³(2s)² = 108s⁵  →  s = (Ksp/108)^(1/5)

COMMON-ION EFFECT: if an ion is already present, put that value in the Initial row.
BUFFER CHECK: use Henderson–Hasselbalch after the ICE table confirms the ratio [A⁻]/[HA].

WORKFLOW DISCIPLINE for every solution problem:
1. Identify the type (colligative? buffer? Ksp? Nernst?)
2. Write the balanced equation and build the ICE table
3. Write the K expression BEFORE substituting numbers
4. Convert units explicitly (g → mol, mL → L, °C → K when needed)
5. Carry units through every line; the final units must match what's asked
6. Apply van't Hoff factor i for ionic solutes in colligative-property problems
7. Match sig figs to the least-precise given value
8. State the final answer with correct units, and sanity-check the magnitude
`;

const SYSTEM_PROMPT_EDU =
  "You are AAOS Study — an educational tutor running on the AAOS Autonomous AI OS. " +
  "Specialize in school subjects: math, biology, chemistry, physics, history, literature, computer science. " +
  "Explain step by step, define terms, and check understanding. " +
  "When the student asks a homework-style question, walk them through the reasoning instead of just giving the final answer. " +
  "Be concise, accurate, and patient. Prefer numbered steps and short examples. " +
  "When asked for flashcards, suggest the user click the Flashcards button for a structured set." +
  CHEMISTRY_OF_SOLUTIONS;

const SYSTEM_PROMPT_VISION =
  "You are AAOS Scholar — an expert academic solver. The user uploaded a screenshot of a problem. " +
  "Solve it correctly and concisely. Cover up to undergraduate level (calculus, linear algebra, ODEs, " +
  "probability, stats, physics, chemistry, biology, CS, economics, humanities). " +
  "Format: (1) one short line naming the topic, (2) numbered solution steps — only the essential math, " +
  "no filler prose, (3) **Final answer:** on its own line. Use LaTeX-style notation (x^2, sqrt(), integrals). " +
  "Be terse. Skip restating the question. Never say you cannot see the image — you can." +
  CHEMISTRY_OF_SOLUTIONS;

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
    image?: string;    // base64 data URL for vision (screenshots)
    pdfText?: string;  // extracted PDF text, injected as system context
    pdfName?: string;  // PDF filename for citation
  };

  // Flashcard mode forces the open-weight educational model and skips tools.
  const isFlashcards = body.mode === "flashcards";
  const hasImage = !!body.image;

  const requested = isFlashcards ? "gpt-oss-20b" : (body.model ?? "gpt-4o-mini");
  const providerChain = resolveProviderChain(requested, hasImage);

  if (!firstAvailable(providerChain)) {
    return new Response(JSON.stringify({ error: "No API key configured for this model. Check Vercel environment variables." }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }

  const sysPrompt = isFlashcards ? SYSTEM_PROMPT_FLASHCARDS
    : hasImage ? SYSTEM_PROMPT_VISION
    : requested === "gpt-oss-20b" ? SYSTEM_PROMPT_EDU
    : SYSTEM_PROMPT;
  const rawMessages = (body.messages ?? []).map(m => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // If a screenshot image was attached, upgrade the last user message to a vision content array
  if (body.image && rawMessages.length > 0) {
    const last = rawMessages[rawMessages.length - 1];
    if (last.role === "user") {
      (rawMessages[rawMessages.length - 1] as unknown as OpenAI.Chat.ChatCompletionMessageParam) = {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: body.image } },
          ...(last.content ? [{ type: "text" as const, text: last.content }] : []),
        ],
      };
    }
  }

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: sysPrompt },
  ];

  // PDF context: inject extracted text as an additional system message so the
  // model can cite it across every turn (sent fresh with each request).
  if (body.pdfText && body.pdfText.trim()) {
    const pdfName = body.pdfName ?? "document.pdf";
    messages.push({
      role: "system",
      content:
        `The user has attached a PDF named "${pdfName}". Use its contents to answer questions ` +
        `about the document. When you reference facts from it, cite as (${pdfName}). ` +
        `If a question is unrelated to the PDF, answer normally.\n\n` +
        `=== PDF TEXT START ===\n${body.pdfText}\n=== PDF TEXT END ===`,
    });
  }

  messages.push(...rawMessages);

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
          const completion = await completeWithFallbacks(providerChain, {
            messages, temperature: 0.5, max_tokens: 1500,
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
        // Vision mode: skip tool calls (focus on solving), trim tokens for fast streaming.
        // 1200 is enough for ~95% of undergrad problems with concise step-by-step work.
        const useTools = !hasImage;
        const maxTok = hasImage ? 1200 : 600;

        // mainClient/mainModel are set on round 0 via fallback selection and
        // reused for subsequent tool-call rounds to keep conversation coherent.
        let mainClient!: OpenAI;
        let mainModel = "";

        for (let round = 0; round < 4; round++) {
          let chunks: AsyncIterable<OpenAI.Chat.ChatCompletionChunk>;
          if (round === 0) {
            const result = await streamWithFallbacks(providerChain, {
              messages,
              ...(useTools ? { tools: TOOLS } : {}),
              temperature: hasImage ? 0.2 : 0.4,
              max_tokens: maxTok,
            });
            chunks = result.chunks;
            mainClient = result.client;
            mainModel = result.modelId;
          } else {
            chunks = await mainClient.chat.completions.create({
              model: mainModel, messages,
              ...(useTools ? { tools: TOOLS } : {}),
              temperature: hasImage ? 0.2 : 0.4,
              max_tokens: maxTok,
              stream: true,
            });
          }

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
          if (!tcList.length || finishReason === "stop" || !useTools) {
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
