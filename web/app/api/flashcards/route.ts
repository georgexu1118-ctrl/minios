export const runtime = "edge";

import { NextRequest } from "next/server";
import OpenAI from "openai";

const MODELS: Record<string, { apiKeyEnv: string; baseURL?: string; modelId: string }> = {
  "gpt-4o-mini": {
    apiKeyEnv: "OPENAI_API_KEY",
    modelId: "gpt-4o-mini",
  },
  "gpt-oss-20b": {
    apiKeyEnv: "TOGETHER_API_KEY",
    baseURL: "https://api.together.xyz/v1",
    modelId: "openai/gpt-oss-20b",
  },
};

const FLASHCARD_SYSTEM =
  "You are AAOS Study — an exam preparation tutor. " +
  "Generate exam-ready flashcards on the topic the user gives you. " +
  "Output ONLY a JSON object with shape: " +
  '{ "cards": [{ "q": "question", "a": "answer", "hint": "one-line hint or empty string" }] }. ' +
  "Do not wrap in markdown fences. Do not add any other prose. " +
  "Mix factual recall, conceptual understanding, and applied problem-solving. " +
  "Keep questions tight (under 25 words) and answers complete but concise (under 60 words).";

interface Flashcard { q: string; a: string; hint?: string; }

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
  const config = MODELS[requested] ?? MODELS["gpt-oss-20b"];

  const apiKey = process.env[config.apiKeyEnv];
  if (!apiKey) {
    return Response.json({
      error: config.apiKeyEnv === "TOGETHER_API_KEY"
        ? "gpt-oss-20b requires TOGETHER_API_KEY. Set it in Vercel env vars."
        : `${config.apiKeyEnv} not configured`,
    }, { status: 500 });
  }

  const openai = new OpenAI({ apiKey, baseURL: config.baseURL });

  const userPrompt =
    `Generate exactly ${count} ${difficulty}-difficulty flashcards on: "${topic}". ` +
    `Return strict JSON: { "cards": [{ "q": "...", "a": "...", "hint": "..." }] }. No prose.`;

  try {
    const completion = await openai.chat.completions.create({
      model: config.modelId,
      messages: [
        { role: "system", content: FLASHCARD_SYSTEM },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 1800,
      // Together's DeepSeek supports JSON mode through the OpenAI-compatible shape.
      response_format: { type: "json_object" },
    });

    const raw = completion.choices?.[0]?.message?.content ?? "{}";
    // Best-effort cleanup: strip possible code fences if model ignores response_format.
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();

    let parsed: { cards?: Flashcard[] } = {};
    try { parsed = JSON.parse(cleaned); }
    catch {
      // Try to find the first { ... } block
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (m) { try { parsed = JSON.parse(m[0]); } catch {} }
    }

    const cards = Array.isArray(parsed.cards) ? parsed.cards.filter(c => c && c.q && c.a) : [];
    if (!cards.length) {
      return Response.json({ error: "model returned no usable cards", raw: raw.slice(0, 400) }, { status: 502 });
    }

    return Response.json({
      topic,
      count: cards.length,
      model: config.modelId,
      cards,
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
