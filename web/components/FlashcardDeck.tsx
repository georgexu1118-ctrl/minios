"use client";
import { useState, useCallback } from "react";
import { X, Loader2, ArrowLeft, ArrowRight, RotateCw, GraduationCap, Sparkles } from "lucide-react";

interface Flashcard { q: string; a: string; hint?: string; }

interface Props {
  open: boolean;
  onClose: () => void;
  model: string;
}

export default function FlashcardDeck({ open, onClose, model }: Props) {
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(8);
  const [difficulty, setDifficulty] = useState<"easy" | "mixed" | "hard">("mixed");
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const generate = useCallback(async () => {
    if (!topic.trim() || loading) return;
    setLoading(true); setErr(null); setCards([]); setIdx(0); setFlipped(false);
    try {
      const res = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), count, difficulty, model }),
      });
      const data = await res.json();
      if (!res.ok || !data.cards) throw new Error(data.error ?? "no cards");
      setCards(data.cards);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "failed");
    } finally {
      setLoading(false);
    }
  }, [topic, count, difficulty, model, loading]);

  if (!open) return null;

  const card = cards[idx];
  const total = cards.length;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4
      bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}>

      <div onClick={e => e.stopPropagation()}
        className="relative w-full max-w-2xl glass-hi rounded-3xl overflow-hidden
          shadow-2xl"
        style={{
          border: "1px solid rgba(167,139,250,0.25)",
          boxShadow: "0 0 80px rgba(124,58,237,0.3), 0 30px 80px rgba(0,0,0,0.6)",
        }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "rgba(120,60,240,0.2)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-800/40 border border-violet-500/40
              flex items-center justify-center animate-pulse-glow">
              <GraduationCap size={16} className="text-violet-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Flashcard Generator</h3>
              <p className="text-[10px] font-mono tracking-widest text-violet-400/70 uppercase">
                Powered by {model === "gpt-oss-20b" ? "GPT-OSS 20B (open)" : "GPT-4o-mini (closed)"}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-lg text-violet-400/50 hover:text-violet-200
              hover:bg-violet-900/40 transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">

          {!cards.length ? (
            // Setup form
            <div className="space-y-5">
              <div>
                <label className="text-[11px] font-mono tracking-widest text-violet-400/70 uppercase mb-2 block">
                  Topic
                </label>
                <input
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") generate(); }}
                  placeholder="e.g. Photosynthesis, AP US History Civil War, Calculus derivatives…"
                  disabled={loading}
                  autoFocus
                  className="w-full glass rounded-xl px-4 py-3 text-sm text-violet-100
                    placeholder-violet-500/40 outline-none border border-violet-700/30
                    focus:border-violet-500/60 transition-colors" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-mono tracking-widest text-violet-400/70 uppercase mb-2 block">
                    How many?
                  </label>
                  <div className="flex gap-1">
                    {[5, 8, 12, 16].map(n => (
                      <button key={n} onClick={() => setCount(n)}
                        className={`flex-1 px-2 py-2 rounded-lg text-xs font-mono cursor-pointer
                          transition-all
                          ${count === n
                            ? "bg-violet-700/50 text-violet-100 border border-violet-500/40"
                            : "glass text-violet-400/60 hover:text-violet-200"}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-mono tracking-widest text-violet-400/70 uppercase mb-2 block">
                    Difficulty
                  </label>
                  <div className="flex gap-1">
                    {(["easy", "mixed", "hard"] as const).map(d => (
                      <button key={d} onClick={() => setDifficulty(d)}
                        className={`flex-1 px-2 py-2 rounded-lg text-xs font-mono cursor-pointer
                          transition-all capitalize
                          ${difficulty === d
                            ? "bg-violet-700/50 text-violet-100 border border-violet-500/40"
                            : "glass text-violet-400/60 hover:text-violet-200"}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {err && (
                <p className="text-xs text-rose-400/90 bg-rose-950/30 border border-rose-700/30 rounded-lg px-3 py-2">
                  {err}
                </p>
              )}

              <button onClick={generate} disabled={!topic.trim() || loading}
                className="w-full btn-shimmer text-white font-semibold tracking-wide
                  rounded-xl py-3 inline-flex items-center justify-center gap-2
                  disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer
                  shadow-lg shadow-violet-900/40">
                {loading
                  ? <><Loader2 size={15} className="animate-spin" /> Generating…</>
                  : <><Sparkles size={15} /> Generate Flashcards</>}
              </button>
            </div>
          ) : (
            // Card viewer
            <div className="space-y-5">
              {/* Progress */}
              <div className="flex items-center justify-between text-[10px] font-mono tracking-widest text-violet-400/70 uppercase">
                <span>Topic: <span className="text-violet-200">{topic}</span></span>
                <span>{idx + 1} / {total}</span>
              </div>

              {/* Card */}
              <div
                onClick={() => setFlipped(f => !f)}
                className="relative w-full h-64 cursor-pointer select-none"
                style={{ perspective: "1200px" }}>
                <div
                  className="absolute inset-0 transition-transform duration-500"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                  }}>

                  {/* Front (Q) */}
                  <div className="absolute inset-0 glass rounded-2xl p-6 flex flex-col"
                    style={{
                      backfaceVisibility: "hidden",
                      border: "1px solid rgba(167,139,250,0.3)",
                    }}>
                    <span className="text-[10px] font-mono tracking-widest text-violet-400/60 uppercase mb-3">
                      Question
                    </span>
                    <p className="text-lg md:text-xl font-medium text-white leading-relaxed flex-1">
                      {card.q}
                    </p>
                    {card.hint && (
                      <p className="text-xs text-violet-300/60 italic mt-3 border-l-2 border-violet-500/30 pl-3">
                        Hint: {card.hint}
                      </p>
                    )}
                    <p className="text-[10px] text-violet-500/40 mt-3 text-center tracking-widest uppercase">
                      Tap to reveal answer
                    </p>
                  </div>

                  {/* Back (A) */}
                  <div className="absolute inset-0 glass rounded-2xl p-6 flex flex-col"
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                      border: "1px solid rgba(74,222,128,0.3)",
                      background: "linear-gradient(135deg, rgba(20,40,30,0.6), rgba(15,15,30,0.6))",
                    }}>
                    <span className="text-[10px] font-mono tracking-widest text-emerald-400/70 uppercase mb-3">
                      Answer
                    </span>
                    <p className="text-base md:text-lg text-violet-50 leading-relaxed flex-1 overflow-y-auto">
                      {card.a}
                    </p>
                    <p className="text-[10px] text-violet-500/40 mt-3 text-center tracking-widest uppercase">
                      Tap to flip back
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-2">
                <button onClick={() => { setIdx(Math.max(0, idx - 1)); setFlipped(false); }}
                  disabled={idx === 0}
                  className="flex-1 glass glow-hover rounded-xl py-2 inline-flex items-center justify-center gap-2
                    text-violet-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition">
                  <ArrowLeft size={14} /> Prev
                </button>
                <button onClick={() => setFlipped(f => !f)}
                  className="px-4 glass glow-hover rounded-xl py-2 inline-flex items-center justify-center gap-2
                    text-violet-300 cursor-pointer transition">
                  <RotateCw size={13} />
                </button>
                <button onClick={() => { setIdx(Math.min(total - 1, idx + 1)); setFlipped(false); }}
                  disabled={idx === total - 1}
                  className="flex-1 glass glow-hover rounded-xl py-2 inline-flex items-center justify-center gap-2
                    text-violet-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition">
                  Next <ArrowRight size={14} />
                </button>
              </div>

              <button
                onClick={() => { setCards([]); setIdx(0); setFlipped(false); }}
                className="w-full text-center text-[11px] font-mono tracking-widest text-violet-500/60 hover:text-violet-300 cursor-pointer">
                ← New Topic
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
