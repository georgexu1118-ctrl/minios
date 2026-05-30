"use client";
import { Bot, User, Globe, TrendingUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Multiple screenshots attached to a single user turn. */
  imageUrls?: string[];
  /** @deprecated use imageUrls */
  imageUrl?: string;
  toolCalls?: { tool: string; args: Record<string, unknown> }[];
  streaming?: boolean;
}

function ToolBadge({ tool, args }: { tool: string; args: Record<string, unknown> }) {
  const isStock = tool === "get_stock";
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono
      bg-violet-950/60 border border-violet-700/40 text-violet-300 mr-1 mb-1">
      {isStock ? <TrendingUp size={10} /> : <Globe size={10} />}
      {isStock ? `$${args.symbol}` : `"${String(args.query).slice(0, 32)}…"`}
    </span>
  );
}

function isStandaloneEquation(line: string): boolean {
  const expression = line.trim().replace(/^(?:[-*]\s+|\d+[.)]\s+)/, "");
  if (!expression.includes("=") || !/(?:\\(?:frac|sqrt|binom|sum|int|prod|lim|left|choose|over)|\^|_)/.test(expression)) return false;

  const withoutCommands = expression
    .replace(/\$/g, "")
    .replace(/\\[A-Za-z]+/g, "")
    .replace(/\b(?:sin|cos|tan|log|ln|max|min)\b/g, "");

  return !/\b[A-Za-z]{2,}\b/.test(withoutCommands);
}

function normalizeOutsideMath(text: string): string {
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]*\$)/g);
  return parts.map((part, index) => {
    if (index % 2 === 1) return part;
    return part.replace(
      /(?<![:/])\b([A-Za-z0-9]{1,3}\^\{?[A-Za-z0-9+\-]+\}?)/g,
      (_match, expression) => `$${expression}$`
    );
  }).join("");
}

// All LaTeX display-math environment names that need $$...$$ wrapping.
const DISPLAY_ENV_RE = /align(?:ed|\*)?|equation\*?|gather(?:ed|\*)?|multline\*?|cases/;
// Maps each environment to the KaTeX-safe inner env name.
function targetEnv(env: string): string {
  if (/^align/.test(env)) return "aligned";
  if (/^gather/.test(env)) return "gathered";
  return env; // equation, cases, multline → keep as-is (KaTeX supports them inside $$)
}

function normalizeDisplayEnvironments(text: string): string {
  // Unified pattern: matches \begin{ENV}...\end{ENV} where ENV is any display env.
  // Strips surrounding $/$$ delimiters (whatever the model used) and rewraps uniformly.
  return text.replace(
    new RegExp(
      `\\$?\\$?\\s*\\\\begin\\{(${DISPLAY_ENV_RE.source})\\}([\\s\\S]*?)` +
      `(?:\\\\end\\{(?:${DISPLAY_ENV_RE.source})\\}|(?=\\n\\s*\\n|$))\\s*\\$?\\$?`,
      "g"
    ),
    (_match, env, body) => {
      const inner = targetEnv(env);
      return `\n$$\n\\begin{${inner}}\n${body.trim()}\n\\end{${inner}}\n$$\n`;
    }
  );
}

export function normalizeMath(text: string): string {
  // ── Step 1: Rescue LaTeX mistakenly wrapped in fenced code blocks ──────────
  text = text.replace(/```(?:[a-z]*\n)?([\s\S]*?)```/g, (match, body) => {
    const trimmed = body.trim();
    const hasLatex = /\\(?:frac|binom|sqrt|sum|int|prod|cdot|dots|left|right|begin|end|alpha|beta|gamma|delta|theta|lambda|mu|pi|sigma|phi|infty|partial|times|leq|geq|neq|approx|equiv|to|forall|exists|mathbb|mathrm|text|hat|bar|vec|over|choose)\b/.test(trimmed);
    const hasCode = /(?:^|\n)\s*(?:def |function |class |import |from |const |let |var |return\b|if\s*[({\w]|for\s*[({\w]|while\s*\(|print\s*\(|console\.|#include|public |private |static |void )/m.test(trimmed);
    if (hasLatex && !hasCode) {
      const cleaned = trimmed.replace(/^\$\$\s*/, "").replace(/\s*\$\$$/, "").trim();
      return `\n$$\n${cleaned}\n$$\n`;
    }
    return match;
  });

  // ── Step 1b: Fix display environments with bad/missing delimiters ───────────
  // Covers: bare \begin{aligned}, single-$ wrapped, or already $$-wrapped (idempotent).
  // Must run BEFORE the $$ mid-line fixer so we don't double-process.
  text = normalizeDisplayEnvironments(text);

  // ── Step 1c: Upgrade single-$ inline math that contains \\ (line breaks) ───
  // Inline math never legitimately needs \\; it means the model mis-wrapped a
  // multi-line block as inline. Upgrade to display $$.
  text = text.replace(/(?<!\$)\$([^$]+\\\\[^$]+)\$(?!\$)/g,
    (_m, inner) => `\n$$\n${inner.trim()}\n$$\n`
  );

  // ── Step 1d: Upgrade single-$ inline math that contains & alignment ops ────
  // & inside math signals an aligned expression; must be display math.
  text = text.replace(/(?<!\$)\$([^$]*&[=<>\s\\|][^$]*)\$(?!\$)/g,
    (_m, inner) => `\n$$\n${inner.trim()}\n$$\n`
  );

  // ── Step 1e: Rescue orphaned \end{aligned/align} with no matching \begin{} ──
  // Happens when the model outputs $\begin{aligned}…\end{aligned}$ but the
  // \begin{} line was on a prior chunk, leaving content + \end{aligned} $ as
  // raw visible text. Two guards prevent false positives:
  //   • [ \t]* instead of \s* — can't jump lines to reach \end{}
  //   • lookback check — skip if \begin{aligned} already appeared nearby
  text = text.replace(
    /((?:[^\n$]*(?:&(?:[=<>|]|\\[a-zA-Z]+)|\\\\)[^\n$]*)+)[ \t]*\\end\{(align(?:ed|\*)?)\}[ \t]*\$?(?!\$)/g,
    function(_m, body, _env, offset, str) {
      const lookback = str.slice(Math.max(0, offset - 500), offset);
      if (/\\begin\{align/.test(lookback)) return _m; // already paired — leave it
      return `\n$$\n\\begin{aligned}\n${body.trim()}\n\\end{aligned}\n$$\n`;
    }
  );

  // ── Step 1f: "$ formula" at line-start → $$ display block ────────────────
  // A single $ followed by a space at the start of a line is the model's
  // mis-use of inline delimiters for display math.  KaTeX/remark-math rejects
  // it (space after $ breaks inline parsing), so it leaks as raw text.
  // Require at least one display-math command before upgrading, so plain
  // prose that starts with a $ symbol (prices, variables) is never touched.
  text = text.replace(
    /^[ \t]*\$(?!\$) ([^$\n]+?)\$?[ \t]*$/gm,
    (_m, inner) => {
      const content = inner.trim();
      if (!/\\(?:frac|left|right|quad|displaystyle|sum|int|prod|lim|binom|begin|sqrt|over|text|cdot|times|infty|partial|nabla)\b/.test(content)) return _m;
      return `$$\n${content}\n$$`;
    }
  );

  // ── Step 1g: Fix "- $$ formula" — list items with $$ but no closing $$ ─────
  // A list item that starts with $$ (e.g. "- $$ \binom{...}") has an unclosed
  // display-math block. An unclosed $$ swallows all following content until the
  // next $$ in the document, breaking every subsequent equation.
  // Fix: convert to inline $formula$ — fractions/binomials render fine inline
  // and the list structure is preserved.  Handles both open-only and open+close.
  text = text.replace(
    /^([ \t]*(?:[-*]|\d+[.)]) ?)\$\$[ \t]*([^$\n]+?)[ \t]*(?:\$\$)?[ \t]*$/gm,
    (_m, listPrefix, formula) => `${listPrefix}$${formula.trim()}$`
  );

  // ── Step 2: Fix $$ glued to surrounding prose on the same line ─────────────
  // e.g. "…formula $$ 2. Next section" → "…formula\n$$\n2. Next section"
  // Don't touch $$ that are already the only thing on a line.
  // 2a. $$ in the middle of a line (text before AND after)
  text = text.replace(/([^\n$])[ \t]*\$\$[ \t]*(?=[^\n$])/g, "$1\n$$\n");
  // 2b. $$ at the very end of a line with text before it: "formula $$"
  text = text.replace(/([^\n$])[ \t]*\$\$[ \t]*$/gm, "$1\n$$");
  // 2c. $$ at the very start of a line followed by space + text: "$$ more text"
  text = text.replace(/^[ \t]*\$\$[ \t]+([^\n$])/gm, "$$\n$1");

  // ── Step 3: Original delimiter + code-fence-skipping normalization ──────────
  const codeParts = text.split(/(```[\s\S]*?```|`[^`]+`)/g);
  return codeParts.map((part, index) => {
    if (index % 2 === 1) return part; // inside code fence/span — leave untouched

    const normalizedDelimiters = part
      .replace(/\\\[([\s\S]*?)\\\]/g, (_match, body) => `\n$$${body}$$\n`)
      .replace(/\\\(([\s\S]*?)\\\)/g, (_match, body) => `$${body}$`);

    return normalizeDisplayEnvironments(normalizedDelimiters)
      .split(/(\$\$[\s\S]*?\$\$)/g)
      .map((segment, segmentIndex) => {
        if (segmentIndex % 2 === 1) return segment;
        return segment
          .split("\n")
          .map(line => {
            if (isStandaloneEquation(line)) {
              const listPrefix = line.match(/^(\s*(?:[-*]|\d+[.)])\s+)(.*)$/);
              const prefix = listPrefix?.[1] ?? "";
              const expression = (listPrefix?.[2] ?? line)
                .replace(/\$\s+\$/g, " \\\\\n")
                .replace(/(\d)\s+\$(?=[A-Za-z(])/g, "$1 \\\\\n$")
                .replace(/\$/g, "")
                .trim();
              return `${prefix}$$\n${expression}\n$$`;
            }
            return normalizeOutsideMath(line);
          })
          .join("\n");
      })
      .join("");
  }).join("");
}

export default function ChatMessage({ msg, model }: { msg: Message; model?: string }) {
  const isUser = msg.role === "user";
  const isNousCoder = model === "nouscoder-14b";

  return (
    <div className={`msg-enter flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} mb-4`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
        ${isUser
          ? "bg-violet-700/40 border border-violet-600/50"
          : "bg-indigo-900/60 border border-indigo-500/40 pulse-glow"
        }`}>
        {isUser
          ? <User size={13} className="text-violet-300" />
          : <Bot size={13} className="text-indigo-300" />
        }
      </div>

      {/* Bubble */}
      <div className={`min-w-0 max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        {msg.toolCalls && msg.toolCalls.length > 0 && (
          <div className="flex flex-wrap">
            {msg.toolCalls.map((tc, i) => (
              <ToolBadge key={i} tool={tc.tool} args={tc.args} />
            ))}
          </div>
        )}

        {/* Multi-image thumbnails */}
        {(() => {
          const imgs = msg.imageUrls?.length ? msg.imageUrls : msg.imageUrl ? [msg.imageUrl] : [];
          if (!imgs.length) return null;
          return (
            <div className={`flex flex-wrap gap-2 mb-1 ${isUser ? "justify-end" : "justify-start"}`}>
              {imgs.map((src, i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-violet-500/30 flex-shrink-0"
                  style={{ maxWidth: 220 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Attached screenshot ${i + 1}`} className="w-full h-auto object-cover" />
                </div>
              ))}
            </div>
          );
        })()}

        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed glass markdown-body
          ${isUser
            ? "rounded-tr-sm border-violet-600/30 text-violet-100 whitespace-pre-wrap"
            : "rounded-tl-sm border-indigo-500/20 text-indigo-100"
          }
          ${!isUser && isNousCoder ? "code-green" : ""}
          ${!msg.content && (msg.imageUrl || msg.imageUrls?.length) ? "hidden" : ""}`}>
          {isUser ? (
            <>
              {msg.content}
              {msg.streaming && <span className="cursor-blink" />}
            </>
          ) : msg.streaming ? (
            // Plain text while streaming — avoids ReactMarkdown/KaTeX re-parsing
            // every token, which causes visible flicker and layout shifts.
            // Snaps to full formatted output once the stream completes.
            <span className="whitespace-pre-wrap">{msg.content}<span className="cursor-blink" /></span>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}>
              {normalizeMath(msg.content)}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
}
