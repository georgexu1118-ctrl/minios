"use client";
import { TrendingUp, Globe, Cpu, Zap, Brain, Shield } from "lucide-react";

const FEATURES = [
  {
    icon: Brain,
    color: "#a78bfa",
    title: "Multi-Model Intelligence",
    desc: "Choose specialized models for current research, coding, study support, screenshot problem solving, and structured flashcards.",
  },
  {
    icon: TrendingUp,
    color: "#34d399",
    title: "Live Market Intelligence",
    desc: "Real-time US stock quotes, P/E ratios, market cap, and 52-week ranges sourced directly from Yahoo Finance. Ask about any ticker.",
  },
  {
    icon: Globe,
    color: "#22d3ee",
    title: "Web Search",
    desc: "DuckDuckGo-powered live web search for current events, breaking news, and post-training-cutoff information. Always up to date.",
  },
  {
    icon: Cpu,
    color: "#f59e0b",
    title: "Custom OS Kernel",
    desc: "AAOS runs inside a hand-crafted 32-bit x86 Multiboot kernel compiled with LLVM. No Linux. No abstractions. Raw silicon intelligence.",
  },
  {
    icon: Zap,
    color: "#f472b6",
    title: "Streaming Responses",
    desc: "Server-Sent Events deliver tokens to your browser the instant they are generated. Zero-latency feel, maximum throughput.",
  },
  {
    icon: Shield,
    color: "#818cf8",
    title: "Secure by Design",
    desc: "API keys stored in DPAPI-encrypted vaults outside the repository. NTFS ACL hardened. Never committed, never leaked.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="relative py-28 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Section header */}
        <div className="text-center mb-16 animate-fade-in">
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-mono
            tracking-widest uppercase glass border-violet-700/30 text-violet-400 mb-5">
            Capabilities
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            <span className="text-gradient">Built different.</span>
            <br />
            <span className="text-violet-100/90">From the silicon up.</span>
          </h2>
          <p className="text-violet-400/70 max-w-xl mx-auto text-sm leading-relaxed">
            AAOS Research is not a wrapper around a model. It is an end-to-end AI system
            with a custom OS kernel at its core and live data feeds at its fingertips.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className={`glass glow-hover rounded-2xl p-6 flex flex-col gap-4
                  animate-fade-in cursor-default`}
                style={{ animationDelay: `${i * 0.1}s`, animationFillMode: "both" }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${f.color}18`, border: `1px solid ${f.color}35` }}>
                  <Icon size={18} style={{ color: f.color }} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-violet-100 mb-1.5">{f.title}</h3>
                  <p className="text-xs text-violet-400/70 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Architecture diagram */}
        <div className="mt-20 glass rounded-3xl p-8 animate-fade-in-delay-2">
          <p className="text-[11px] font-mono tracking-widest text-violet-500/60 uppercase mb-6">
            System Architecture
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-mono">
            {[
              { label: "Browser", color: "#22d3ee" },
              { label: "→" },
              { label: "Next.js UI", color: "#a78bfa" },
              { label: "→" },
              { label: "FastAPI", color: "#818cf8" },
              { label: "→" },
              { label: "Model Router", color: "#f59e0b" },
              { label: "→" },
              { label: "OpenAI", color: "#34d399" },
              { label: "→" },
              { label: "AAOS Kernel", color: "#f472b6" },
            ].map((item, i) =>
              item.label === "→" ? (
                <span key={i} className="text-violet-600/50">→</span>
              ) : (
                <span key={i} className="px-3 py-1.5 rounded-lg text-[11px]"
                  style={{
                    background: `${item.color}12`,
                    border: `1px solid ${item.color}30`,
                    color: item.color,
                  }}>
                  {item.label}
                </span>
              )
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {[
              { label: "↓ Yahoo Finance", color: "#34d399" },
              { label: "↓ DuckDuckGo Search", color: "#22d3ee" },
              { label: "↓ Supabase", color: "#60a5fa" },
            ].map((item, i) => (
              <span key={i} className="px-3 py-1 rounded-lg text-[10px]"
                style={{
                  background: `${item.color}10`,
                  border: `1px solid ${item.color}25`,
                  color: item.color,
                }}>
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
