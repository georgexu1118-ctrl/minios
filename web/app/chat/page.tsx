"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { Zap, ArrowLeft, RotateCcw, Sparkles } from "lucide-react";
import ChatMessage, { type Message } from "@/components/ChatMessage";
import ChatInput, { type PdfAttachment } from "@/components/ChatInput";
import NebulaLayers from "@/components/NebulaLayers";
import FlashcardDeck from "@/components/FlashcardDeck";

const StarField = dynamic(() => import("@/components/StarField"), { ssr: false });

const API_BASE = "";

const SUGGESTED = [
  "What is AAOI trading at right now?",
  "Latest news on Anthropic or OpenAI?",
  "Find all primes p such that p² + 2 is prime.",
  "Compare AAOI vs NVDA YTD performance",
  "What are the biggest tech stories today?",
  "How does gravitational lensing work?",
];

const MODELS = [
  {
    id: "gpt-4o-mini",
    label: "Kimi K2",
    role: "General",
    desc: "Moonshot AI · 1T-param MoE on Groq LPU · stocks, news, code, frontier reasoning",
    accent: "violet",
  },
  {
    id: "gpt-oss-20b",
    label: "GPT-OSS 20B",
    role: "Educational",
    desc: "OpenAI open weights · ~1000 tok/s · schoolwork, screenshot problem solving, flashcards",
    accent: "emerald",
  },
] as const;

type ModelId = typeof MODELS[number]["id"];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => uuidv4());
  const [model, setModel] = useState<ModelId>("gpt-4o-mini");
  const [flashcardsOpen, setFlashcardsOpen] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [pdf, setPdf] = useState<PdfAttachment | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLElement>(null);
  const stickToBottomRef = useRef(true);

  // Only auto-scroll when the user is already near the bottom — prevents
  // streaming tokens from yanking the viewport while the user is reading higher up.
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      stickToBottomRef.current =
        el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!stickToBottomRef.current) return;
    // Instant scroll prevents the jitter caused by overlapping smooth scrolls
    // during token streaming.
    bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
  }, [messages]);

  const send = useCallback(async (question?: string) => {
    const q = (question ?? input).trim();
    if ((!q && !image) || loading) return;
    setInput("");
    const sentImage = image;
    setImage(null);

    const userMsg: Message = { id: uuidv4(), role: "user", content: q, imageUrl: sentImage ?? undefined };
    const aiId = uuidv4();
    const aiMsg: Message = { id: aiId, role: "assistant", content: "", streaming: true };

    setMessages(prev => [...prev, userMsg, aiMsg]);
    setLoading(true);

    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          session_id: sessionId,
          model,
          image: sentImage,
          pdfText: pdf?.text,
          pdfName: pdf?.name,
        }),
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
  }, [input, image, pdf, loading, messages, sessionId, model]);

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
          <div className="relative w-7 h-7 rounded-full overflow-hidden flex-shrink-0"
            style={{
              boxShadow: "0 0 8px rgba(139,92,246,0.5), 0 0 16px rgba(124,58,237,0.2)",
              border: "1px solid rgba(139,92,246,0.45)",
            }}>
            <Image
              src="/galileo-moon.webp"
              alt="AAOS"
              width={28} height={28}
              className="w-full h-full object-cover object-top"
              style={{ filter: "sepia(1) hue-rotate(222deg) saturate(2.2) brightness(0.72) contrast(1.25)", transform: "scale(1.08)" }}
            />
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
          <button onClick={() => setFlashcardsOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
              bg-emerald-700/30 border border-emerald-500/40 text-emerald-200
              text-[11px] font-mono tracking-wider cursor-pointer
              hover:bg-emerald-700/50 transition-colors"
            title="Generate exam flashcards">
            <Sparkles size={11} /> Flashcards
          </button>

          <div className="hidden sm:flex items-center gap-1 text-[10px] text-violet-400/50">
            <Zap size={10} />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
            live
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

      {/* ── MODEL SELECTOR ───── */}
      <div className="relative z-10 px-4 md:px-8 pt-4 pb-3 flex-shrink-0">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-[10px] font-mono tracking-[0.25em] text-violet-400/70 uppercase mb-3">
            Choose your model
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
            {MODELS.map(m => {
              const active = model === m.id;
              const accent = m.accent;
              const isEdu = accent === "emerald";
              const styles = isEdu
                ? { bg: "bg-emerald-900/40", border: "border-emerald-500/60", shadow: "shadow-emerald-900/30",
                    badgeBg: "bg-emerald-700/40", badgeText: "text-emerald-200", badgeBorder: "border-emerald-500/30",
                    dot: "bg-emerald-400" }
                : { bg: "bg-violet-900/40", border: "border-violet-500/60", shadow: "shadow-violet-900/30",
                    badgeBg: "bg-violet-700/40", badgeText: "text-violet-200", badgeBorder: "border-violet-500/30",
                    dot: "bg-violet-400" };
              return (
                <button key={m.id}
                  onClick={() => setModel(m.id)}
                  disabled={loading}
                  className={`relative rounded-xl p-3 md:p-4 text-left transition-all duration-200
                    cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 overflow-hidden
                    ${active
                      ? `${styles.bg} ${styles.border} shadow-lg ${styles.shadow}`
                      : "glass border-violet-700/20 hover:border-violet-500/40"}
                    border-2`}>
                  <div className="flex items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-sm md:text-base font-bold text-white tracking-tight">
                          {m.label}
                        </span>
                        <span className={`text-[9px] font-mono tracking-widest uppercase px-1.5 py-0.5 rounded
                          ${styles.badgeBg} ${styles.badgeText} border ${styles.badgeBorder}`}>
                          {m.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-violet-300/70 leading-snug pr-14">
                        {m.desc}
                      </p>
                    </div>
                    {active && (
                      <div className={`absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse ${styles.dot}`} />
                    )}
                  </div>

                  {/* Baby Yoda — educational card only */}
                  {isEdu && (
                    <div className="absolute bottom-0 right-1 w-[62px] pointer-events-none select-none"
                      style={{ animation: "yoda-float 3.2s ease-in-out infinite" }}>
                      <svg viewBox="0 0 100 138" xmlns="http://www.w3.org/2000/svg">
                        {/* Robe */}
                        <path d="M26 95 Q50 110 74 95 L80 132 Q50 142 20 132 Z" fill="#7a5c2a"/>
                        <path d="M33 100 Q50 112 67 100 L70 128 Q50 136 30 128 Z" fill="#8f6d35"/>
                        {/* Neck */}
                        <rect x="43" y="88" width="14" height="11" rx="4" fill="#5fa832"/>
                        {/* Left ear */}
                        <ellipse cx="13" cy="54" rx="13" ry="7.5" fill="#5fa832" transform="rotate(-28 13 54)"/>
                        <ellipse cx="13" cy="54" rx="9" ry="5" fill="#c4907a" transform="rotate(-28 13 54)"/>
                        {/* Right ear */}
                        <ellipse cx="87" cy="54" rx="13" ry="7.5" fill="#5fa832" transform="rotate(28 87 54)"/>
                        <ellipse cx="87" cy="54" rx="9" ry="5" fill="#c4907a" transform="rotate(28 87 54)"/>
                        {/* Head */}
                        <ellipse cx="50" cy="58" rx="29" ry="27" fill="#6ab83a"/>
                        {/* Forehead wrinkles */}
                        <path d="M36 44 Q50 40 64 44" stroke="#4a8020" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.6"/>
                        <path d="M40 49 Q50 46 60 49" stroke="#4a8020" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.4"/>
                        {/* Eyes */}
                        <circle cx="39" cy="58" r="7.5" fill="#120800"/>
                        <circle cx="61" cy="58" r="7.5" fill="#120800"/>
                        {/* Eye shine */}
                        <circle cx="42" cy="54.5" r="2.5" fill="white" opacity="0.9"/>
                        <circle cx="64" cy="54.5" r="2.5" fill="white" opacity="0.9"/>
                        <circle cx="40" cy="60" r="1" fill="white" opacity="0.4"/>
                        <circle cx="62" cy="60" r="1" fill="white" opacity="0.4"/>
                        {/* Nose */}
                        <ellipse cx="50" cy="68" rx="4" ry="3" fill="#4a8020"/>
                        <circle cx="48" cy="67" r="1" fill="#3a6015" opacity="0.5"/>
                        <circle cx="52" cy="67" r="1" fill="#3a6015" opacity="0.5"/>
                        {/* Smile */}
                        <path d="M41 76 Q50 83 59 76" stroke="#3a6015" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                        {/* Little hands reaching out cutely */}
                        <ellipse cx="24" cy="118" rx="8" ry="5" fill="#6ab83a" transform="rotate(-25 24 118)"/>
                        <ellipse cx="76" cy="118" rx="8" ry="5" fill="#6ab83a" transform="rotate(25 76 118)"/>
                        {/* Finger lines */}
                        <line x1="20" y1="116" x2="23" y2="121" stroke="#4a8020" strokeWidth="0.8" opacity="0.5"/>
                        <line x1="25" y1="115" x2="27" y2="121" stroke="#4a8020" strokeWidth="0.8" opacity="0.5"/>
                        <line x1="73" y1="115" x2="75" y2="121" stroke="#4a8020" strokeWidth="0.8" opacity="0.5"/>
                        <line x1="78" y1="116" x2="77" y2="121" stroke="#4a8020" strokeWidth="0.8" opacity="0.5"/>
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Messages */}
      <main ref={scrollContainerRef} className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 md:px-8 min-h-0">
        <div className="max-w-3xl mx-auto">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center min-h-[55vh] text-center gap-8">
              <div className="animate-fade-in">
                <div className="relative w-16 h-16 rounded-full overflow-hidden mx-auto mb-4"
                  style={{
                    boxShadow: "0 0 24px rgba(139,92,246,0.5), 0 0 50px rgba(124,58,237,0.22)",
                    border: "1.5px solid rgba(139,92,246,0.50)",
                  }}>
                  <Image
                    src="/galileo-moon.webp"
                    alt="AAOS"
                    width={64} height={64}
                    className="w-full h-full object-cover object-top"
                    style={{ filter: "sepia(1) hue-rotate(222deg) saturate(2.0) brightness(0.68) contrast(1.3)", transform: "scale(1.06)" }}
                  />
                </div>
                <h2 className="text-2xl font-bold text-gradient mb-2">
                  AAOS Research
                </h2>
                <p className="text-violet-400/60 text-sm max-w-sm">
                  Intelligence from a custom OS kernel. Ask about stocks,
                  current events, science, or anything in the universe.
                </p>
                <p className="text-violet-500/50 text-[11px] max-w-md mx-auto mt-3">
                  Pick <span className="text-white font-semibold">Kimi K2</span> (Moonshot, frontier reasoning) or
                  <span className="text-white font-semibold"> GPT-OSS 20B</span> (open, schoolwork).
                  GPT-OSS supports <span className="text-emerald-300 font-semibold">screenshot problem solving</span> and flashcards.
                </p>
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
            image={image}
            onImageChange={setImage}
            pdf={pdf}
            onPdfChange={setPdf}
          />
          <p className="text-center text-[9px] text-violet-500/30 mt-2 tracking-widest uppercase">
            AAOS Research · Kimi K2 · GPT-OSS 20B · Screenshots · Flashcards · Live Web
          </p>
        </div>
      </footer>

      <FlashcardDeck open={flashcardsOpen} onClose={() => setFlashcardsOpen(false)} model={model} />
    </div>
  );
}
