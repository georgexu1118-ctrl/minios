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
const COMPANY_TICKERS: Array<[RegExp, string]> = [
  [/\b(?:apple|aapl)\b/i, "AAPL"],
  [/\b(?:microsoft|msft)\b/i, "MSFT"],
  [/\b(?:nvidia|nvda)\b/i, "NVDA"],
  [/\b(?:tesla|tsla)\b/i, "TSLA"],
  [/\b(?:meta platforms|facebook|meta)\b/i, "META"],
  [/\b(?:amazon|amzn)\b/i, "AMZN"],
  [/\b(?:alphabet|google|googl|goog)\b/i, "GOOGL"],
  [/\b(?:advanced micro devices|amd)\b/i, "AMD"],
  [/\b(?:applied optoelectronics|aaoi)\b/i, "AAOI"],
];

function detectedTickers(query: string): string[] {
  const tickers: string[] = [];
  for (const [company, ticker] of COMPANY_TICKERS) {
    if (company.test(query) && !tickers.includes(ticker)) tickers.push(ticker);
  }
  for (const match of query.matchAll(/\$([A-Z]{1,5})\b/g)) {
    if (!tickers.includes(match[1])) tickers.push(match[1]);
  }
  return tickers;
}

function needsLiveNews(query: string): boolean {
  const mentionsNews = /\b(news|headline|breaking|latest|today|current events?|this week|this month|recent developments?|recent announcements?|what(?:'s| is) happening)\b/i.test(query);
  const marketMovement = /\b(stock|shares?|market|ticker|earnings|nasdaq|s&p|dow)\b/i.test(query) &&
    /\b(why|news|catalyst|move|moving|up|down|surge|jump|drop|fall|fell|rally|selloff|outlook)\b/i.test(query);
  return mentionsNews || marketMovement;
}

function freshNewsQuery(query: string): string {
  if (/\b(today|breaking|right now)\b/i.test(query)) return `${query} when:1d`;
  if (/\b(latest|recent|this week|news|headline|stock|shares?|market)\b/i.test(query)) return `${query} when:7d`;
  return query;
}

function needsStockQuotes(query: string): boolean {
  return detectedTickers(query).length > 0 &&
    /\b(trading|price|quote|stock|shares?|compare|versus|vs\.?|performance|ytd|year.to.date|up|down|move|moving)\b/i.test(query);
}

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

// Fetch a URL and return clean text — strips HTML, collapses whitespace.
// Works in Edge Runtime (no DOMParser needed).
async function fetchPage(url: string): Promise<Record<string, unknown>> {
  url = (url ?? "").trim();
  if (!url) return { error: "no URL provided" };
  // Only allow http/https
  if (!/^https?:\/\//i.test(url)) return { error: "invalid URL (must start with http/https)" };

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AAOS-Research/1.0)",
        "Accept": "text/html,application/xhtml+xml,text/plain",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) return { error: `HTTP ${res.status} from ${url}` };

    const raw = await res.text();

    // Strip <script>, <style>, <head> blocks entirely
    const stripped = raw
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<head[\s\S]*?<\/head>/gi, " ")
      // Remove all remaining tags
      .replace(/<[^>]+>/g, " ")
      // Decode common HTML entities
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&mdash;/g, "—")
      .replace(/&ndash;/g, "–")
      .replace(/&hellip;/g, "…")
      // Collapse whitespace
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    // Cap at 20 000 chars — enough for a full math competition problem set + solutions
    const text = stripped.length > 20000 ? stripped.slice(0, 20000) + "\n\n[… content truncated …]" : stripped;
    return { url, length: stripped.length, text };
  } catch (e) {
    return { error: `Failed to fetch "${url}": ${String(e)}` };
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
      name: "fetch_page",
      description: "Fetch the full text content of any URL (webpage, solution sheet, problem set, article). " +
        "Use this whenever the user pastes a URL and wants you to read, check, or analyse its content. " +
        "Works for math competition solutions, homework PDFs rendered as HTML, textbook pages, etc.",
      parameters: {
        type: "object",
        properties: { url: { type: "string", description: "The full URL to fetch (must start with http:// or https://)" } },
        required: ["url"],
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

const MATH_LATEX_RULE =
  " Always use valid LaTeX delimiters: $x^2$ for short inline math and $$...$$ for displayed equations. " +
  "Put each equation chain on its own single display block, for example $$(3x)^2 = (2\\sqrt{2})^2 + 4^2 = 24$$. " +
  "For multi-line derivations use one $$\\begin{aligned}...\\end{aligned}$$ block, never raw \\begin{align*}. " +
  "Never mix delimited and undelimited expressions on one equation line, and never output bare ^ or _.";

const SYSTEM_PROMPT =
  "You are AAOS — the Autonomous AI OS — an advanced intelligence running on a custom " +
  "32-bit OS kernel built from scratch. " +
  "Use get_stock for US stock questions (live Yahoo Finance data). " +
  "ALWAYS call web_search for ANY question about: current events, today's news, latest news, " +
  "what's happening, recent announcements, this week, this month, this year, or anything that " +
  "could have changed after your training cutoff. NEVER respond with 'I cannot retrieve news' or " +
  "similar disclaimers — you have web_search available. Call it. When web_search returns results, " +
  "summarize them naturally with the source publication name and date for each story. For stock news, " +
  "distinguish confirmed price movement from possible catalysts and never claim a headline caused a move without evidence. " +
  "Answer general/timeless knowledge from your own training without searching. " +
  "When the user pastes a URL, call fetch_page to read it. " +
  "Be concise, accurate, and confident. Prefer bullet points for multi-part answers." +
  MATH_LATEX_RULE;

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

// Compact chemistry reference — key formulas only; frontier models know the derivations.
const STEM_RULES =
  " STEM precision rules —" +
  " MATH: show every step. Algebra: factor, complete-the-square, quadratic formula x=(-b±√(b²-4ac))/2a." +
  " Calculus: chain/product/quotient rules, u-sub, IBP, L'Hôpital (0/0 or ∞/∞), Taylor series." +
  " Linear algebra: RREF, det, eigenvalues from det(A−λI)=0, orthogonality." +
  " Diff-eq: separable, integrating factor, char. eq for const-coeff homogeneous, Laplace." +
  " Stats: mean/σ²/σ, z=(x−μ)/σ, p-value, CI, Bayes P(A|B)=P(B|A)P(A)/P(B)." +
  " PHYSICS: draw FBD first. Kinematics: v=u+at, s=ut+½at², v²=u²+2as." +
  " Newton F=ma; momentum p=mv; energy KE=½mv², PE=mgh, conservation." +
  " E&M: Coulomb F=kq₁q₂/r², Gauss ∮E·dA=Q/ε₀, Faraday ε=−dΦ/dt." +
  " Circuits: V=IR, P=IV, series R=ΣRᵢ, parallel 1/R=Σ1/Rᵢ." +
  " Thermo: ΔU=Q−W, PV=nRT, ΔS=Qrev/T, Carnot η=1−Tc/Th, ΔG=ΔH−TΔS." +
  " Waves: v=fλ, Doppler f'=f(v±vo)/(v∓vs), n=c/v, Snell n₁sinθ₁=n₂sinθ₂." +
  " Quantum: E=hf, λ=h/p, Heisenberg ΔxΔp≥ℏ/2, Schrödinger Ĥψ=Eψ." +
  " Relativity: γ=1/√(1−β²), E=γmc², t'=γt, length contraction L=L₀/γ." +
  " BIOLOGY: cell cycle G1→S→G2→M (IPMAT for mitosis)." +
  " DNA replication semi-conservative; transcription DNA→mRNA; translation mRNA→protein (codons)." +
  " Mendelian: dominant/recessive, Punnett squares, Hardy-Weinberg p²+2pq+q²=1." +
  " Photosynthesis 6CO₂+6H₂O→C₆H₁₂O₆+6O₂; respiration reverses it." +
  " CS: Big-O analysis; binary search O(log n); merge/quick sort O(n log n);" +
  " BFS/DFS on graphs; DP = memoization + optimal substructure; recursion base cases first.";

const CHEMISTRY_OF_SOLUTIONS =
  " Chemistry precision rules: M=mol/L, m=mol/kg-solvent; colligative props use i·K·m (i=vant Hoff);" +
  " ΔTb=i·Kb·m, ΔTf=i·Kf·m, Π=iMRT; Raoult P=xP°;" +
  " pH+pOH=14, Ka=[H⁺][A⁻]/[HA], Henderson-Hasselbalch pH=pKa+log([A⁻]/[HA]);" +
  " ICE tables for all equilibria, check x/C₀<5% for small-x approx;" +
  " Ksp stoichiometry must match; Q vs Ksp decides precipitation;" +
  " Nernst E=E°−(0.0592/n)logQ at 25°C; ΔG°=−nFE°=−RTlnK." +
  " Always carry units, apply i for ionic solutes, sanity-check magnitude.";

const SYSTEM_PROMPT_EDU =
  "You are AAOS Study — an educational tutor running on the AAOS Autonomous AI OS. " +
  "Specialize in school subjects: math, biology, chemistry, physics, history, literature, computer science. " +
  "Explain step by step, define terms, and check understanding. " +
  "When the student asks a homework-style question, walk them through the reasoning instead of just giving the final answer. " +
  "Be concise, accurate, and patient. Prefer numbered steps and short examples. " +
  "When asked for flashcards, suggest the user click the Flashcards button for a structured set. " +
  "For current stock prices or stock comparisons, use get_stock rather than web_search. For current news, use web_search. " +
  "If a live research context has already been supplied, answer from it directly and never repeat its tool requests. " +
  "When the user pastes a URL (solution page, problem set, article), ALWAYS call fetch_page with that URL first — never say you cannot access it. " +
  "Math contest workflow: if the user gives you a contest URL AND a solution URL, call fetch_page on BOTH in the same turn (parallel). " +
  "After reading the contest, solve every problem and list all answers. " +
  "After reading the solutions, compare each answer — mark ✓ if correct, ✗ if wrong and show the correct answer. " +
  "If asked for answers only (no steps), output a numbered list of just the final answers, one per line." +
  MATH_LATEX_RULE +
  STEM_RULES +
  CHEMISTRY_OF_SOLUTIONS;

const SYSTEM_PROMPT_VISION =
  "You are AAOS Scholar — an expert academic solver. The user uploaded a screenshot of a problem. " +
  "Solve it correctly and concisely. Cover up to undergraduate level (calculus, linear algebra, ODEs, " +
  "probability, stats, physics, chemistry, biology, CS, economics, humanities). " +
  "Format: (1) one short line naming the topic, (2) numbered solution steps — only the essential math, " +
  "no filler prose, (3) **Final answer:** on its own line. " +
  "Be terse. Skip restating the question. Never say you cannot see the image — you can." +
  MATH_LATEX_RULE +
  STEM_RULES +
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
  // Cap history at 10 messages (5 exchanges) — keeps input tokens lean for fast TTFT.
  const rawMessages = (body.messages ?? []).slice(-10).map(m => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));
  const latestUserQuery = [...rawMessages].reverse().find(message => message.role === "user")?.content ?? "";
  const shouldPrefetchNews = !isFlashcards && !hasImage && needsLiveNews(latestUserQuery);
  const shouldPrefetchStocks = !isFlashcards && !hasImage && needsStockQuotes(latestUserQuery);

  // ── Server-side URL pre-fetch ──────────────────────────────────────────────
  // When the user pastes URLs in their message, fetch them immediately on the
  // server and inject the text as context — no tool-call round-trip needed.
  // This avoids the model's context window overflowing with large tool results
  // and removes one full network round-trip from the critical path.
  // Limited to 3 URLs, 6 000 chars each (stays safely inside 8 192-tok window).
  const urlsInQuery = !isFlashcards && !hasImage
    ? (latestUserQuery.match(/https?:\/\/[^\s"'<>)]+/g) ?? []).slice(0, 3)
    : [];
  let prefetchedUrlContext = "";
  if (urlsInQuery.length > 0) {
    const fetched = await Promise.all(urlsInQuery.map(u => fetchPage(u)));
    const parts = fetched
      .map((r, i) => r.text
        ? `=== URL ${i + 1}: ${urlsInQuery[i]} ===\n${String(r.text).slice(0, 6000)}\n=== END URL ${i + 1} ===`
        : `=== URL ${i + 1}: ${urlsInQuery[i]} — fetch failed: ${r.error} ===`)
      .join("\n\n");
    prefetchedUrlContext = parts;
  }

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

  // Inject pre-fetched URL content before user messages
  if (prefetchedUrlContext) {
    messages.push({
      role: "system",
      content: "The following URLs were fetched from the user's message and their full text content is provided below. Use this content to answer the user's question directly — do NOT call fetch_page again for these URLs.\n\n" + prefetchedUrlContext,
    });
  }

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
        const hasPrefetchedResearch = shouldPrefetchNews || shouldPrefetchStocks;
        const useTools = !hasImage && !hasPrefetchedResearch;
        const isEdu = requested === "gpt-oss-20b";
        // Edu: 2000 tok — enough for 10 contest answers with brief working (~150 tok/Q).
        // Vision: 1200 tok — screenshot solving is concise by design.
        // General: 800 tok — keeps TTFT fast for conversational use.
        const maxTok = hasImage ? 1200 : isEdu ? 2000 : 800;

        if (hasPrefetchedResearch) {
          let newsResult: Record<string, unknown> | undefined;
          if (shouldPrefetchNews) {
            const searchQuery = freshNewsQuery(latestUserQuery);
            send({ type: "tool_call", tool: "web_search", args: { query: searchQuery } });
            try {
              const results = await googleNews(searchQuery);
              newsResult = results.length
                ? { query: searchQuery, source: "google news", retrieved_at: new Date().toISOString(), results }
                : await webSearch(searchQuery);
            } catch {
              newsResult = await webSearch(searchQuery);
            }
            send({ type: "tool_result", tool: "web_search", result: newsResult });
          }

          const quoteResults: Record<string, unknown>[] = [];
          for (const ticker of shouldPrefetchStocks ? detectedTickers(latestUserQuery) : []) {
            send({ type: "tool_call", tool: "get_stock", args: { symbol: ticker } });
            const quoteResult = await getStock(ticker);
            send({ type: "tool_result", tool: "get_stock", result: quoteResult });
            quoteResults.push(quoteResult);
          }

          const liveContext =
            "Live research has already been retrieved for this request. Answer directly from this context; " +
            "do not call tools again for this answer. " +
            "cite publication names and publication dates for news items, state the retrieval timestamp when useful, " +
            "and provide article links when summarizing headlines. For stock news, separate the live quote from " +
            "reported developments and do not assert causation unless a cited source explicitly reports it.\n\n" +
            (newsResult ? `NEWS_RESULTS=${JSON.stringify(newsResult)}\n` : "") +
            (quoteResults.length ? `STOCK_QUOTES=${JSON.stringify(quoteResults)}` : "");
          const historyStart = messages.length - rawMessages.length;
          messages.splice(historyStart, 0, { role: "system", content: liveContext });
        }

        // mainClient/mainModel are set on round 0 via fallback selection and
        // reused for subsequent tool-call rounds to keep conversation coherent.
        let mainClient!: OpenAI;
        let mainModel = "";

        // Educational mode gets more rounds: fetch questions → fetch solutions → answer = 3 rounds min.
        const maxRounds = isEdu ? 6 : 4;
        for (let round = 0; round < maxRounds; round++) {
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

          // Execute tools — all in parallel so two fetch_page calls don't stack.
          const assistantMsg: OpenAI.Chat.ChatCompletionMessageParam = {
            role: "assistant",
            content: content || null,
            tool_calls: tcList.map(tc => ({
              id: tc.id, type: "function" as const,
              function: { name: tc.name, arguments: tc.args },
            })),
          };
          messages.push(assistantMsg);

          // Parse args and emit call events first (so UI shows badges immediately)
          const parsedArgs = tcList.map(tc => {
            let args: Record<string, string> = {};
            try { args = JSON.parse(tc.args || "{}"); } catch { /* bad json */ }
            send({ type: "tool_call", tool: tc.name, args });
            return { tc, args };
          });

          // Fire all tool calls concurrently
          const toolResults = await Promise.all(
            parsedArgs.map(async ({ tc, args }) => {
              let result: Record<string, unknown>;
              if (tc.name === "get_stock") result = await getStock(args.symbol ?? "");
              else if (tc.name === "web_search") result = await webSearch(args.query ?? "");
              else if (tc.name === "fetch_page") result = await fetchPage(args.url ?? "");
              else result = { error: `unknown tool ${tc.name}` };
              return { tc, args, result };
            })
          );

          for (const { tc, result } of toolResults) {
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
