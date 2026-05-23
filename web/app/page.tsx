"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import dynamic from "next/dynamic";
import ChatMessage, { type Message } from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import { Cpu, Satellite, Zap } from "lucide-react";

const VantaBackground = dynamic(() => import("@/components/VantaBackground"), { ssr: false });

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const SUGGESTED = [
  "What is AAPL trading at right now?",
  "Latest news on SpaceX Starship?",
  "Explain how black holes work",
  "Compare NVDA vs AMD market cap",
  "What happened in tech today?",
  "How does the minios kernel work?",
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => uuidv4());
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async (question?: string) => {
    const q = (question ?? input).trim();
    if (!q || loading) return;
    setInput("");

    const userMsg: Message = { id: uuidv4(), role: "user", content: q };
    const assistantId = uuidv4();
    const assistantMsg: Message = { id: assistantId, role: "assistant", content: "", streaming: true };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setLoading(true);

    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, session_id: sessionId }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      const toolCalls: Message["toolCalls"] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const raw = dec.decode(value, { stream: true });
        for (const line of raw.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const ev = JSON.parse(line.slice(6));
            if (ev.type === "text") {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: m.content + ev.text } : m
              ));
            } else if (ev.type === "tool_call") {
              toolCalls.push({ tool: ev.tool, args: ev.args });
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, toolCalls: [...toolCalls] } : m
              ));
            } else if (ev.type === "done") {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, streaming: false } : m
              ));
            }
          } catch {
            // partial JSON — skip
          }
        }
      }
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: `[error: ${err instanceof Error ? err.message : "unknown"}]`, streaming: false }
          : m
      ));
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, sessionId]);

  const isEmpty = messages.length === 0;

  return (
    <>
      <VantaBackground />

      <div className="flex flex-col h-screen">
        {/* ── Header ── */}
        <header className="glass border-b border-violet-800/20 px-6 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-700/50 border border-violet-500/40
              flex items-center justify-center pulse-glow">
              <Cpu size={16} className="text-violet-300" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-widest text-violet-200 uppercase">
                minios <span className="text-violet-400">AI</span>
              </h1>
              <p className="text-[10px] text-violet-500/70 tracking-wider">
                Kernel · Hermes · OpenAI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-violet-400/60">
            <span className="flex items-center gap-1">
              <Satellite size={11} /> gpt-4o-mini
            </span>
            <span className="flex items-center gap-1">
              <Zap size={11} />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              live
            </span>
          </div>
        </header>

        {/* ── Messages ── */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
          <div className="max-w-3xl mx-auto">
            {isEmpty ? (
              /* Hero / empty state */
              <div className="flex flex-col items-center justify-center min-h-[55vh] text-center gap-8">
                <div>
                  <div className="w-20 h-20 rounded-2xl bg-violet-900/40 border border-violet-600/30
                    flex items-center justify-center mx-auto mb-5 pulse-glow">
                    <Cpu size={36} className="text-violet-400" />
                  </div>
                  <h2 className="text-3xl font-bold text-violet-100 mb-2 tracking-tight">
                    minios AI
                  </h2>
                  <p className="text-violet-400/70 text-sm max-w-sm">
                    An AI assistant born inside a custom 32-bit OS kernel.
                    Ask anything — stocks, web search, or the cosmos.
                  </p>
                </div>

                {/* Suggestions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
                  {SUGGESTED.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="glass glow-hover rounded-xl px-4 py-3 text-left text-xs
                        text-violet-300/80 hover:text-violet-200 transition-all duration-200
                        border-violet-700/20 cursor-pointer">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map(msg => <ChatMessage key={msg.id} msg={msg} />)
            )}
            <div ref={bottomRef} />
          </div>
        </main>

        {/* ── Input ── */}
        <footer className="glass border-t border-violet-800/20 px-4 py-4 md:px-8 z-10">
          <div className="max-w-3xl mx-auto">
            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={() => send()}
              loading={loading}
            />
            <p className="text-center text-[10px] text-violet-500/40 mt-2 tracking-wider">
              minios AI · Powered by OpenAI + Hermes · Live web search · Yahoo Finance
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
