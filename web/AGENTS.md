<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:aaos-web-agent-rules -->
# AAOS Web Agent Rules

> Read the root `AGENTS.md` for full architecture. These are `web/`-specific additions for Codex and other agents.

## Runtime constraints (critical)

- `app/api/chat/`, `app/api/chart/`, `app/api/flashcards/` → **Edge Runtime only**
  - No `fs`, `path`, `child_process`, or any Node.js built-in
  - No npm packages that require Node.js internals
- `app/api/pdf/` → **Node.js runtime** (set with `export const runtime = "nodejs"`) — required for `unpdf`

## Provider fallback chain — how to add a model

`app/api/chat/route.ts` contains four `ProviderConfig[]` arrays:
- `GENERAL_PROVIDERS` — used when `model = "gpt-4o-mini"` (Kimi K2)
- `EDU_PROVIDERS` / `EDU_PDF_PROVIDERS` — used when `model = "gpt-oss-20b"`
- `CODING_PROVIDERS` — used when `model = "nouscoder-14b"`
- `VISION_PROVIDERS` — used when an image is attached

To add a model: append to the correct array. First entry with an available env key wins. The function `resolveProviderChain()` selects the array; `streamWithFallbacks()` / `completeWithFallbacks()` execute it.

## Kimi K2 leak handling — do not remove

Kimi K2 on Groq sometimes emits tool invocations as raw text (`delta.content`) instead of structured `delta.tool_calls`. The constants `TOOLCALL_MARKERS`, and the functions `safeFlushLength()` and `parseLeakedToolCalls()`, handle all known leak syntax patterns. This code is a live workaround for an upstream provider bug — it is correct and must be preserved.

## SSE event protocol

`/api/chat` emits these event `type` values:

| type | When |
|------|------|
| `tool_call` | Just before a tool executes |
| `tool_result` | After a tool returns |
| `text` | Streaming token chunk |
| `flashcards` | Flashcard mode — full JSON array |
| `done` | Stream complete |
| `error` | Unrecoverable error |

`ChatMessage.tsx` and `FloatingChat.tsx` both depend on these type strings. Do not rename them.

## KaTeX / math rendering

`ChatMessage.tsx` normalizes model-generated LaTeX. Key functions:
- `normalizeOutsideMath()` — wraps bare `^`/`_` expressions outside math delimiters
- `normalizeDisplayEnvironments()` — fixes `\begin{align}`, `\begin{equation}`, etc.
- `isStandaloneEquation()` — detects bare equations needing `$$` wrapping

These fix real edge cases from all three deployed models. Do not simplify or delete them without testing on STEM output (algebra, calculus, chemistry).

## History window (do not change without reason)

The number of messages sent per API call is intentionally tuned:
- PDF sessions → last 20 (context needed across document pages)
- General/Kimi K2 → last 6 (reduces prefill cost on a 1T-param model)
- Other → last 10

These are performance trade-offs, not arbitrary — adjust only if there is a clear correctness problem.
<!-- END:aaos-web-agent-rules -->
