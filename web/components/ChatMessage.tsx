"use client";
import { User, Globe, TrendingUp } from "lucide-react";
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

function isLikelyMath(content: string): boolean {
  const trimmed = content.trim();
  if (trimmed.length === 0) return false;
  // Single letter or letter-number variable like n, x, y, i, j, x1, t0
  if (/^[a-zA-Z](\d+)?$/.test(trimmed)) return true;
  // Standard LaTeX commands like \frac, \alpha, etc.
  if (/\\(?:[a-zA-Z]+)/.test(trimmed)) return true;
  // Common math symbols or operations
  if (/[\^_*={}\[\]<>~+\-/]/.test(trimmed)) return true;
  return false;
}

function escapeNonMathDollars(text: string): string {
  const codeParts = text.split(/(```[\s\S]*?```|`[^`]+`)/g);
  return codeParts.map((part, index) => {
    if (index % 2 === 1) return part; // inside code block/span — leave untouched
    
    // Split by display math $$...$$ first to preserve display math blocks
    const displayParts = part.split(/(\$\$[\s\S]*?\$\$)/g);
    return displayParts.map((dispPart, dispIndex) => {
      if (dispIndex % 2 === 1) return dispPart; // inside display math — leave untouched
      
      // Process line by line to escape lone / plain text dollar signs
      const lines = dispPart.split("\n");
      const processedLines = lines.map(line => {
        const dollarIndices: number[] = [];
        for (let i = 0; i < line.length; i++) {
          if (line[i] === '$') {
            let backslashCount = 0;
            let j = i - 1;
            while (j >= 0 && line[j] === '\\') {
              backslashCount++;
              j--;
            }
            if (backslashCount % 2 === 0) {
              dollarIndices.push(i);
            }
          }
        }

        if (dollarIndices.length === 0) return line;

        let result = "";
        let lastIdx = 0;
        
        for (let k = 0; k < dollarIndices.length; k += 2) {
          if (k + 1 < dollarIndices.length) {
            const idx1 = dollarIndices[k];
            const idx2 = dollarIndices[k + 1];
            const content = line.slice(idx1 + 1, idx2);
            
            const isMath = isLikelyMath(content);
            
            result += line.slice(lastIdx, idx1);
            if (isMath) {
              result += "$" + content + "$";
            } else {
              result += "\\$" + content + "\\$";
            }
            lastIdx = idx2 + 1;
          } else {
            const idx = dollarIndices[k];
            result += line.slice(lastIdx, idx) + "\\$";
            lastIdx = idx + 1;
          }
        }
        result += line.slice(lastIdx);
        return result;
      });
      return processedLines.join("\n");
    }).join("");
  }).join("");
}

export function normalizeMath(text: string): string {
  // First, escape any lone or plain-text dollar signs to avoid confusing the markdown parser
  text = escapeNonMathDollars(text);

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

function NeptuneAvatar({ size }: { size: number }) {
  const blur = (f: number) => `${Math.max(1, size * f)}px`;
  return (
    <div className="relative overflow-hidden rounded-full flex-shrink-0" style={{ width: size, height: size }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes neptune-avatar-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-neptune-spin-slow {
          animation: neptune-avatar-spin 45s linear infinite;
        }
      `}} />
      
      <div className="absolute inset-0 rounded-full" style={{
        background:
          "radial-gradient(circle at 36% 34%, #3b82f6 0%, #2563eb 8%, #1d4ed8 18%, #1e3a8a 34%, #172554 54%, #0f172a 74%, #060c18 90%, #000 100%)",
        boxShadow:
          `inset -${size * 0.22}px -${size * 0.12}px ${size * 0.4}px rgba(0,0,0,0.85),` +
          `inset ${size * 0.04}px ${size * 0.04}px ${size * 0.22}px rgba(96,165,250,0.12)`,
      }}>
        {/* Rotating atmospheric features */}
        <div className="absolute inset-0 animate-neptune-spin-slow" style={{ transformOrigin: "center center" }}>
          {/* Painting brushstroke bands */}
          <div className="absolute" style={{
            top: "18%", left: "-8%", width: "116%", height: "22%",
            background: "linear-gradient(182deg, transparent 0%, rgba(59,130,246,0.28) 35%, rgba(96,165,250,0.18) 60%, rgba(147,197,253,0.08) 80%, transparent 100%)",
            filter: `blur(${blur(0.045)})`,
            transform: "rotate(-1.5deg)",
          }} />
          <div className="absolute" style={{
            top: "44%", left: "-8%", width: "116%", height: "18%",
            background: "linear-gradient(178deg, transparent 0%, rgba(37,99,235,0.22) 40%, rgba(59,130,246,0.13) 68%, transparent 100%)",
            filter: `blur(${blur(0.05)})`,
            transform: "rotate(1deg)",
          }} />
          <div className="absolute" style={{
            top: "66%", left: "-8%", width: "116%", height: "12%",
            background: "linear-gradient(181deg, transparent 0%, rgba(29,78,216,0.16) 45%, rgba(37,99,235,0.09) 72%, transparent 100%)",
            filter: `blur(${blur(0.04)})`,
          }} />

          {/* Great Dark Spot — deep void */}
          <div className="absolute" style={{
            top: "34%", left: "20%", width: "30%", height: "18%",
            background: "radial-gradient(ellipse at 45% 50%, rgba(3,7,24,0.95) 0%, rgba(8,14,42,0.80) 48%, transparent 80%)",
            filter: `blur(${blur(0.024)})`,
            transform: "rotate(-8deg)",
          }} />
          {/* Dark Spot inner swirl */}
          <div className="absolute" style={{
            top: "37%", left: "24%", width: "20%", height: "12%",
            background: "radial-gradient(ellipse at 42% 48%, rgba(15,23,60,0.88) 0%, transparent 75%)",
            filter: `blur(${blur(0.016)})`,
            transform: "rotate(-10deg)",
          }} />

          {/* Scooter cloud — bright brushstroke */}
          <div className="absolute" style={{
            top: "43%", left: "47%", width: "16%", height: "7%",
            background: "radial-gradient(ellipse, rgba(219,234,254,0.65) 0%, rgba(186,230,253,0.32) 50%, transparent 80%)",
            filter: `blur(${blur(0.016)})`,
          }} />

          {/* Cirrus streaks */}
          <div className="absolute" style={{
            top: "21%", left: "28%", width: "36%", height: "4%",
            background: "linear-gradient(90deg, transparent, rgba(186,230,253,0.40) 35%, rgba(219,234,254,0.28) 58%, transparent)",
            filter: `blur(${blur(0.014)})`,
            transform: "rotate(-2.5deg)",
          }} />
          <div className="absolute" style={{
            top: "57%", left: "12%", width: "28%", height: "3%",
            background: "linear-gradient(92deg, transparent, rgba(147,197,253,0.30) 40%, rgba(186,230,253,0.18) 65%, transparent)",
            filter: `blur(${blur(0.014)})`,
            transform: "rotate(1.5deg)",
          }} />

          {/* Atmospheric banding */}
          <div className="absolute inset-0" style={{
            backgroundImage:
              "repeating-linear-gradient(177deg, transparent 0%, rgba(30,58,138,0.22) 2.5%, transparent 5.5%, rgba(59,130,246,0.10) 8.5%, transparent 12%)",
            mixBlendMode: "overlay",
          }} />
        </div>

        {/* Polar brightening */}
        <div className="absolute" style={{
          top: "-4%", left: "8%", width: "84%", height: "34%",
          background: "radial-gradient(ellipse at 50% 18%, rgba(147,197,253,0.20) 0%, rgba(96,165,250,0.08) 50%, transparent 75%)",
          filter: `blur(${blur(0.06)})`,
        }} />
        <div className="absolute" style={{
          bottom: "-4%", left: "12%", width: "76%", height: "28%",
          background: "radial-gradient(ellipse at 50% 82%, rgba(96,165,250,0.14) 0%, transparent 70%)",
          filter: `blur(${blur(0.05)})`,
        }} />

        {/* Chromatic aberration */}
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at 8% 50%, rgba(96,165,250,0.18) 0%, transparent 38%)",
          mixBlendMode: "screen",
        }} />

        {/* Terminator shadow */}
        <div className="absolute inset-0" style={{
          background: "radial-gradient(circle at 68% 60%, transparent 22%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.82) 88%)",
        }} />

        {/* Specular highlights */}
        <div className="absolute rounded-full" style={{
          top: `${size * 0.07}px`, left: `${size * 0.20}px`,
          width: size * 0.24, height: size * 0.15,
          background: "radial-gradient(circle, rgba(219,234,254,0.52) 0%, rgba(186,230,253,0.22) 45%, transparent 75%)",
          filter: `blur(${blur(0.012)})`,
        }} />
      </div>
    </div>
  );
}

export default function ChatMessage({ msg, model }: { msg: Message; model?: string }) {
  const isUser = msg.role === "user";
  const isNousCoder = model === "nouscoder-14b";

  return (
    <div className={`msg-enter flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} mb-4`}>
      {/* Avatar */}
      {isUser ? (
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-violet-700/40 border border-violet-600/50">
          <User size={13} className="text-violet-300" />
        </div>
      ) : (
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center relative select-none">
          {/* Inner breathing halo around the planet */}
          <div className="absolute inset-0 rounded-full bg-indigo-500/10 filter blur-[4px] scale-[1.3] pulse-glow animate-pulse" />
          <NeptuneAvatar size={32} />
        </div>
      )}

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
              rehypePlugins={[[rehypeKatex, { throwOnError: false }]]}>
              {normalizeMath(msg.content)}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
}
