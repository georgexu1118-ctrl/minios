# AAOS Web — Claude Code Instructions

> Web subdirectory overrides. Read the **root `CLAUDE.md`** first — this file only adds `web/`-specific details.

## This is Next.js 16 — read the actual docs

This is **Next.js 16.2.6** with the App Router. APIs, file conventions, and data-fetching patterns differ significantly from what is in most training data. Before writing any route or layout code, check `node_modules/next/dist/docs/`. Heed all deprecation warnings — they are real.

## Running the dev server

```bash
# From the web/ directory:
npm run dev          # http://localhost:3000
npm run build        # verify production parity
npm run lint         # ESLint
```

## Route runtime constraints

| Route | Runtime | Why |
|-------|---------|-----|
| `app/api/chat/route.ts` | `edge` | Zero cold-start, global CDN, token streaming |
| `app/api/chart/route.ts` | `edge` | Lightweight proxy |
| `app/api/flashcards/route.ts` | `edge` | LLM call only |
| `app/api/pdf/route.ts` | `nodejs` | `unpdf` requires Node.js |

**Do not switch any Edge route to Node.js runtime.** Do not add `fs`, `path`, `child_process`, or any other Node.js built-in to Edge routes.

## Tailwind CSS v4

Uses `@tailwindcss/postcss` PostCSS plugin — there is no `tailwind.config.js`. Configuration is in `postcss.config.mjs`. The v4 API differs from v3.

## Streaming SSE protocol

`/api/chat` emits `data: <json>` events. `ChatMessage.tsx` and `FloatingChat.tsx` parse the `type` field: `text`, `tool_call`, `tool_result`, `flashcards`, `done`, `error`. Do not rename these event types — both consumers depend on them.

## KaTeX / math rendering

`ChatMessage.tsx` contains normalization logic for model-generated LaTeX:
- `normalizeOutsideMath()` — wraps bare `^`/`_` expressions
- `normalizeDisplayEnvironments()` — rewraps mismatched `\begin{align}`/`\begin{equation}` blocks
- `isStandaloneEquation()` — detects bare equations that need `$$` wrapping

These functions fix real edge cases in model output from all three providers. Do not simplify or remove them without testing on real STEM queries (number theory, physics, chemistry).

## Component conventions

- `"use client"` at the top for any component using hooks or browser APIs.
- `dynamic(() => import(...), { ssr: false })` for canvas/browser-only components (`StarField`, `FloatingAaoiTicker`).
- Keep state local — no prop drilling, no global state library.

## TypeScript

`next.config.ts` has `typescript: { ignoreBuildErrors: true }` as a legacy escape hatch. All new code you write should be properly typed. Do not introduce new `any` types or new type-suppression comments.
