export const runtime = "edge";

import { NextRequest } from "next/server";
import OpenAI from "openai";

// Three providers, all speaking OpenAI Chat Completions.
//   • gpt-4o-mini  → OpenAI direct (closed, fast, reliable, always default fallback)
//   • gpt-oss-20b  → Groq if GROQ_API_KEY set (very fast LPU), else Together AI
const MODELS: Record<string, { tries: { apiKeyEnv: string; baseURL?: string; modelId: string }[] }> = {
  "gpt-4o-mini": {
    tries: [
      { apiKeyEnv: "OPENAI_API_KEY", modelId: "gpt-4o-mini" },
    ],
  },
  "gpt-oss-20b": {
    tries: [
      { apiKeyEnv: "GROQ_API_KEY",     baseURL: "https://api.groq.com/openai/v1",  modelId: "openai/gpt-oss-20b" },
      { apiKeyEnv: "TOGETHER_API_KEY", baseURL: "https://api.together.xyz/v1",     modelId: "openai/gpt-oss-20b" },
    ],
  },
};

const FLASHCARD_SYSTEM =
  "You are AAOS Study — a fast, accurate exam flashcard generator. " +
  "Output ONLY raw JSON in this exact shape — no markdown fences, no commentary, no preamble: " +
  '{"cards":[{"q":"question","a":"answer"}]}. ' +
  "Each q is a single concept under 20 words. Each a is one tight sentence under 35 words. " +
  "Mix definitional recall, conceptual reasoning, and short applied problems.";

interface Flashcard { q: string; a: string; hint?: string; }

// Repair a JSON string that was truncated mid-array. Walks back to the last
// complete object and closes the brackets, salvaging whatever the model produced.
function repairTruncatedJSON(s: string): string {
  let str = s.trim();
  // strip code fences if any
  str = str.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  // try parsing as-is first
  try { JSON.parse(str); return str; } catch {}

  // find last complete object inside the "cards" array
  const arrStart = str.indexOf("[");
  if (arrStart < 0) return str;
  // walk forward, tracking brace depth, recording end of each top-level object
  let depth = 0;
  let inStr = false;
  let escaped = false;
  let lastObjectEnd = -1;
  for (let i = arrStart; i < str.length; i++) {
    const ch = str[i];
    if (escaped) { escaped = false; continue; }
    if (ch === "\\") { escaped = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) lastObjectEnd = i;
    }
  }
  if (lastObjectEnd < 0) return str;

  // Close array at the last complete object, then close the wrapping object
  let repaired = str.slice(0, lastObjectEnd + 1) + "]";
  // ensure wrapping {"cards": [...]} is closed
  const wrapDepth = (repaired.match(/\{/g) || []).length - (repaired.match(/\}/g) || []).length;
  for (let i = 0; i < wrapDepth; i++) repaired += "}";
  return repaired;
}

function extractCards(raw: string): Flashcard[] {
  if (!raw) return [];

  let candidate = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();

  // case 1: object with "cards" key
  let parsed: unknown = null;
  try { parsed = JSON.parse(candidate); } catch {}
  if (!parsed) {
    // case 2: raw bare array
    const arrMatch = candidate.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (arrMatch) {
      try { parsed = JSON.parse(arrMatch[0]); } catch {}
    }
  }
  if (!parsed) {
    // case 3: truncated — repair and try again
    try { parsed = JSON.parse(repairTruncatedJSON(candidate)); } catch {}
  }

  let cards: unknown[] = [];
  if (Array.isArray(parsed)) cards = parsed;
  else if (parsed && typeof parsed === "object" && Array.isArray((parsed as { cards?: unknown[] }).cards)) {
    cards = (parsed as { cards: unknown[] }).cards;
  }

  return cards
    .map(c => {
      if (!c || typeof c !== "object") return null;
      const o = c as Record<string, unknown>;
      const q = typeof o.q === "string" ? o.q : (typeof o.front === "string" ? o.front : null);
      const a = typeof o.a === "string" ? o.a : (typeof o.back  === "string" ? o.back  : null);
      if (!q || !a) return null;
      return { q: q.trim(), a: a.trim() };
    })
    .filter((c): c is Flashcard => !!c);
}

async function tryGenerate(
  apiKey: string,
  baseURL: string | undefined,
  modelId: string,
  topic: string,
  count: number,
  difficulty: string,
  useResponseFormat: boolean,
  isGroq: boolean,
  timeoutMs: number,
): Promise<{ cards: Flashcard[]; raw: string; error?: string }> {
  const openai = new OpenAI({ apiKey, baseURL, timeout: timeoutMs, maxRetries: 0 });
  const userPrompt =
    `Generate exactly ${count} ${difficulty}-difficulty flashcards on: "${topic}". ` +
    `Output ONLY: {"cards":[{"q":"...","a":"..."}]}. No prose, no fences.`;

  try {
    // gpt-oss on Groq defaults to medium reasoning effort which adds ~15s
    // of CoT tokens we don't need for structured flashcard JSON. Force low.
    const extras: Record<string, unknown> = {};
    if (isGroq) extras.reasoning_effort = "low";

    const completion = await openai.chat.completions.create({
      model: modelId,
      messages: [
        { role: "system", content: FLASHCARD_SYSTEM },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 4000,
      stream: false,
      ...(useResponseFormat ? { response_format: { type: "json_object" } } : {}),
      ...extras,
    });
    const raw = completion.choices?.[0]?.message?.content ?? "";
    return { cards: extractCards(raw), raw };
  } catch (e) {
    return { cards: [], raw: "", error: String(e) };
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    topic?: string;
    count?: number;
    model?: string;
    difficulty?: string;
  };

  const topic = (body.topic ?? "").trim();
  if (!topic) {
    return Response.json({ error: "topic is required" }, { status: 400 });
  }
  const count = Math.min(Math.max(body.count ?? 8, 1), 20);
  const difficulty = body.difficulty ?? "mixed";
  const requested = body.model ?? "gpt-oss-20b";
  const primary = MODELS[requested] ?? MODELS["gpt-oss-20b"];

  // Build attempt order with per-provider timeouts so the whole call stays
  // under Vercel's 25s edge function limit even if one provider hangs.
  const hasGroq     = !!process.env.GROQ_API_KEY;
  const hasTogether = !!process.env.TOGETHER_API_KEY;
  const hasOpenAI   = !!process.env.OPENAI_API_KEY;

  type Attempt = { apiKeyEnv: string; baseURL?: string; modelId: string; timeoutMs: number };
  const attempts: Attempt[] = [];

  if (requested === "gpt-oss-20b") {
    // Prefer Groq (fast), then OpenAI fallback. Skip Together when Groq is
    // available — Together is too slow to be a useful fallback inside 25s.
    if (hasGroq)     attempts.push({ apiKeyEnv: "GROQ_API_KEY",     baseURL: "https://api.groq.com/openai/v1",  modelId: "openai/gpt-oss-20b", timeoutMs: 8000 });
    if (!hasGroq && hasTogether) attempts.push({ apiKeyEnv: "TOGETHER_API_KEY", baseURL: "https://api.together.xyz/v1", modelId: "openai/gpt-oss-20b", timeoutMs: 18000 });
    if (hasOpenAI)   attempts.push({ apiKeyEnv: "OPENAI_API_KEY",   modelId: "gpt-4o-mini",                                                                  timeoutMs: 12000 });
  } else {
    if (hasOpenAI)   attempts.push({ apiKeyEnv: "OPENAI_API_KEY",   modelId: "gpt-4o-mini",                                                                  timeoutMs: 12000 });
  }

  let lastError = attempts.length ? "all providers failed" : "no providers configured";
  let lastRaw = "";

  for (const t of attempts) {
    const apiKey = process.env[t.apiKeyEnv]!;
    const useResponseFormat = t.apiKeyEnv === "OPENAI_API_KEY";
    const isGroq = t.apiKeyEnv === "GROQ_API_KEY";
    const out = await tryGenerate(apiKey, t.baseURL, t.modelId, topic, count, difficulty, useResponseFormat, isGroq, t.timeoutMs);
    if (out.cards.length) {
      return Response.json({
        topic,
        count: out.cards.length,
        model: t.modelId,
        provider: t.baseURL ?? "openai",
        cards: out.cards,
      });
    }
    lastError = out.error ?? "no cards parsed";
    lastRaw = out.raw;
  }

  return Response.json({
    error: lastError,
    hint: "All providers failed. Add GROQ_API_KEY for fast open-weight generation.",
    raw: lastRaw.slice(0, 300),
  }, { status: 502 });
}
