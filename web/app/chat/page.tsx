"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Cpu, Zap, ArrowLeft, RotateCcw, Lock, Unlock } from "lucide-react";
import ChatMessage, { type Message } from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import NebulaLayers from "@/components/NebulaLayers";

const StarField = dynamic(() => import("@/components/StarField"), { ssr: false });

const API_BASE = "";

const SUGGESTED = [
  "What is AAOI trading at right now?",
  "Latest news on Anthropic or OpenAI?",
  "Explain how the AAOS kernel handles COM1 serial I/O",
  "Compare AAOI vs NVDA YTD performance",
  "What are the biggest tech stories today?",
  "How does gravitational lensing work?",
];

const MODELS = [
  { id: "gpt-4o-mini",  label: "gpt-4o-mini",   tag: "closed", desc: "OpenAI proprietary · fastest · cheapest" },
  { id: "gpt-oss-120b", label: "gpt-oss-120b",  tag: "open",   desc: "OpenAI open weights · hosted on Together AI" },
] as const;

type ModelId = typeof MODELS[number]["id"];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => uuidv4());
  const [model, setModel] = useState<ModelId>("gpt-4o-mini");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async (question?: string) => {
    const q = (question ?? input).trim();
    if (!q || loading) return;
    setInput("");

    const userMsg: Message = { id: uuidv4(), role: "user", content: q };
    const aiId = uuidv4();
    const aiMsg: Message = { id: aiId, role: "assistant", content: "", streaming: true };

    setMessages(prev => [...prev, userMsg, aiMsg]);
    setLoading(true);

    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, session_id: sessionId, model }),
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

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
                m.id === aiId ? { ...m, content: m.content + ev.text } : m
              ));
            } else if (ev.type === "tool_call") {
              toolCalls.push({ tool: ev.tool, args: ev.args });
              setMessages(prev => prev.map(m =>
                m.id === aiId ? { ...m, toolCalls: [...toolCalls] } : m
              ));
            } else if (ev.type === "done") {
              setMessages(prev => prev.map(m =>
                m.id === aiId ? { ...m, streaming: false } : m
              ));
            }
          } catch { /* partial */ }
        }
      }
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === aiId
          ? { ...m, content: `[error: ${err instanceof Error ? err.message : "unknown"}]`, streaming: false }
          : m
      ));
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, sessionId, model]);

  const isEmpty = messages.length === 0;

  return (
    <div className="relative flex flex-col h-screen overflow-hidden">
      <StarField />
      <NebulaLayers />

      {/* Header */}
      <header className="relative z-10 glass border-b px-4 py-3 flex items-center justify-between flex-shrink-0"
        style={{ borderColor: "rgba(120,60,240,0.15)" }}>
        <div className="flex items-center gap-3">
          <Link href="/"
            className="p-1.5 rounded-lg text-violet-500/50 hover:text-violet-300
              hover:bg-violet-900/30 transition-colors">
            <ArrowLeft size={14} />
          </Link>
          <div className="w-7 h-7 rounded-lg bg-violet-800/50 border border-violet-500/40
            flex items-center justify-center animate-pulse-glow">
            <Cpu size={13} className="text-violet-300" />
          </div>
          <div>
            <h1 className="text-xs font-bold tracking-[0.15em] text-gradient uppercase">
              AAOS Research
            </h1>
            <p className="text-[9px] text-violet-500/60 tracking-widest">
              Autonomous AI OS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Model toggle */}
          <div className="hidden md:flex items-center gap-1 p-0.5 rounded-lg glass"
            style={{ borderColor: "rgba(120,60,240,0.2)" }}
            title="Choose between closed-weight (gpt-4o-mini) and open-weight (gpt-oss-120b) models">
            {MODELS.map(m => {
              const active = model === m.id;
              const isOpen = m.tag === "open";
              return (
                <button key={m.id}
                  onClick={() => setModel(m.id)}
                  disabled={loading}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px]
                    font-mono tracking-wider cursor-pointer transition-all duration-200
                    disabled:cursor-not-allowed disabled:opacity-60
                    ${active
                      ? (isOpen
                          ? "bg-emerald-700/40 text-emerald-200 border border-emerald-500/40"
                          : "bg-violet-700/40 text-violet-100 border border-violet-500/40")
                      : "text-violet-400/60 hover:text-violet-200 border border-transparent"}`}>
                  {isOpen ? <Unlock size={9} /> : <Lock size={9} />}
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[10px] text-violet-400/50">
            <span className="flex items-center gap-1">
              <Zap size={10} />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
              live
            </span>
          </div>
          {!isEmpty && (
            <button
              onClick={() => setMessages([])}
              className="p-1.5 rounded-lg text-violet-500/50 hover:text-violet-300
                hover:bg-violet-900/30 transition-colors cursor-pointer"
              title="Clear conversation">
              <RotateCcw size={13} />
            </button>
          )}
        </div>
      </header>

      {/* Messages */}
      <main className="relative z-10 flex-1 overflow-y-auto px-4 py-6 md:px-8 min-h-0">
        <div className="max-w-3xl mx-auto">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center min-h-[55vh] text-center gap-8">
              <div className="animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-violet-900/40 border border-violet-600/30
                  flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
                  <Cpu size={28} className="text-violet-400" />
                </div>
                <h2 className="text-2xl font-bold text-gradient mb-2">
                  AAOS Research
                </h2>
                <p className="text-violet-400/60 text-sm max-w-sm">
                  Intelligence from a custom OS kernel. Ask about stocks,
                  current events, science, or anything in the universe.
                </p>
                <p className="text-violet-500/50 text-[11px] max-w-md mx-auto mt-3">
                  Choose between <span className="text-violet-300">GPT-4o-mini</span> (closed)
                  and OpenAI&apos;s <span className="text-emerald-300">gpt-oss-120b</span> (open weights) — toggle in the header.
                </p>
              </div>

              {/* Model toggle on mobile / empty state */}
              <div className="md:hidden flex items-center gap-1 p-0.5 rounded-lg glass">
                {MODELS.map(m => {
                  const active = model === m.id;
                  const isOpen = m.tag === "open";
                  return (
                    <button key={m.id} onClick={() => setModel(m.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px]
                        font-mono tracking-wider cursor-pointer transition-all
                        ${active
                          ? (isOpen ? "bg-emerald-700/40 text-emerald-200 border border-emerald-500/40"
                                    : "bg-violet-700/40 text-violet-100 border border-violet-500/40")
                          : "text-violet-400/60"}`}>
                      {isOpen ? <Unlock size={10} /> : <Lock size={10} />}
                      {m.label}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl animate-fade-in-delay-1">
                {SUGGESTED.map(s => (
                  <button key={s} onClick={() => send(s)}
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

      {/* Input */}
      <footer className="relative z-10 glass border-t px-4 py-4 md:px-8 flex-shrink-0"
        style={{ borderColor: "rgba(120,60,240,0.15)" }}>
        <div className="max-w-3xl mx-auto">
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={() => send()}
            loading={loading}
          />
          <p className="text-center text-[9px] text-violet-500/30 mt-2 tracking-widest uppercase">
            AAOS Research · Kernel · GPT-4o-mini (closed) + gpt-oss-120b (open) · Live Web
          </p>
        </div>
      </footer>
    </div>
  );
}
