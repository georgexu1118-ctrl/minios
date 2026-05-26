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
  if (!expression.includes("=") || !/(?:\\(?:frac|sqrt)|\^|_)/.test(expression)) return false;

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

function normalizeDisplayEnvironments(text: string): string {
  return text.replace(
    /\\begin\{align\*?\}([\s\S]*?)(?:\\end\{align\*?\}|(?=\n\s*\n|$))/g,
    (_match, body) => `\n$$\n\\begin{aligned}\n${body.trim()}\n\\end{aligned}\n$$\n`
  );
}

export function normalizeMath(text: string): string {
  const codeParts = text.split(/(```[\s\S]*?```|`[^`]+`)/g);
  return codeParts.map((part, index) => {
    if (index % 2 === 1) return part;

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

export default function ChatMessage({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";

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

        {msg.imageUrl && (
          <div className={`rounded-xl overflow-hidden border border-violet-500/30 mb-1 ${isUser ? "self-end" : "self-start"}`}
            style={{ maxWidth: 260 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={msg.imageUrl} alt="Attached screenshot" className="w-full h-auto object-cover" />
          </div>
        )}

        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed glass markdown-body
          ${isUser
            ? "rounded-tr-sm border-violet-600/30 text-violet-100 whitespace-pre-wrap"
            : "rounded-tl-sm border-indigo-500/20 text-indigo-100"
          }
          ${!msg.content && msg.imageUrl ? "hidden" : ""}`}>
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
