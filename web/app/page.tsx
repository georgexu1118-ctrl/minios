"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, ChevronDown, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";
import NebulaLayers from "@/components/NebulaLayers";
import FeaturesSection from "@/components/FeaturesSection";
import FloatingChat from "@/components/FloatingChat";

const StarField    = dynamic(() => import("@/components/StarField"),    { ssr: false });
const WormholeOrb  = dynamic(() => import("@/components/WormholeOrb"), { ssr: false });

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Background layers */}
      <StarField />
      <NebulaLayers />

      {/* Fixed nav */}
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-14">

        {/* Interstellar-style horizontal light band */}
        <div className="absolute inset-x-0 top-[42%] h-px pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.4) 30%, rgba(167,139,250,0.6) 50%, rgba(124,58,237,0.4) 70%, transparent)" }}
        />
        <div className="absolute inset-x-0 top-[42%] h-24 -translate-y-1/2 pointer-events-none"
          style={{ background: "linear-gradient(180deg, transparent, rgba(88,28,235,0.05) 50%, transparent)", filter: "blur(20px)" }}
        />

        <div className="relative max-w-5xl mx-auto text-center flex flex-col items-center gap-8">

          {/* Status badge */}
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
              glass border-violet-700/30 text-[11px] font-mono tracking-widest text-violet-400/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              AAOS v1.0 · Kernel Active · Hermes Integrated
            </span>
          </div>

          {/* Wormhole orb */}
          <div className="animate-fade-in-delay-1">
            <WormholeOrb />
          </div>

          {/* Headline */}
          <div className="animate-fade-in-delay-2 space-y-3">
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05]">
              <span className="text-gradient">Intelligence</span>
              <br />
              <span className="text-violet-100">Beyond the</span>
              <br />
              <span className="text-gradient-gold">Known Universe</span>
            </h1>
          </div>

          {/* Subtext */}
          <p className="animate-fade-in-delay-3 max-w-xl text-violet-300/70 text-base md:text-lg
            leading-relaxed font-light">
            AAOS Research is an autonomous AI system running inside a hand-crafted
            32-bit OS kernel — with live market data, web intelligence, and the
            reasoning power of a Hermes agent.
          </p>

          {/* CTAs */}
          <div className="animate-fade-in-delay-4 flex flex-wrap items-center justify-center gap-3">
            <Link href="/chat"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                btn-shimmer text-white font-medium text-sm tracking-wide
                shadow-lg shadow-violet-900/40 hover:shadow-violet-800/60
                transition-shadow duration-300">
              Launch Chat <ArrowRight size={15} />
            </Link>
            <a href="https://github.com/georgexu1118-ctrl/aaos"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                glass glow-hover text-violet-300 font-medium text-sm tracking-wide">
              <ExternalLink size={15} /> GitHub
            </a>
          </div>

          {/* Metrics row */}
          <div className="animate-fade-in-delay-4 flex flex-wrap gap-6 justify-center mt-2">
            {[
              { val: "32-bit", label: "x86 Kernel" },
              { val: "< 50ms", label: "First Token" },
              { val: "Live", label: "Market Data" },
              { val: "OSS", label: "Open Source" },
            ].map(m => (
              <div key={m.label} className="text-center">
                <p className="text-lg font-bold text-gradient">{m.val}</p>
                <p className="text-[10px] text-violet-500/60 tracking-widest uppercase">{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float opacity-40">
          <ChevronDown size={20} className="text-violet-400" />
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────── */}
      <FeaturesSection />

      {/* ── DEMO STRIP ───────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[11px] font-mono tracking-widest text-violet-500/60 uppercase mb-4">
            Live Demo
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-violet-100 mb-3">
            Ask AAOS anything, right now
          </h2>
          <p className="text-violet-400/60 text-sm mb-8">
            Click the chat button in the bottom-right corner for a live preview,
            or open the full interface.
          </p>
          <Link href="/chat"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl
              btn-shimmer text-white font-semibold tracking-wide text-base">
            Open Full Chat Interface <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="glass border-t py-8 px-4"
        style={{ borderColor: "rgba(120,60,240,0.12)" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center
          justify-between gap-4 text-[11px] text-violet-500/50">
          <span className="font-mono tracking-widest">AAOS RESEARCH © 2026</span>
          <div className="flex gap-6">
            <Link href="/chat" className="hover:text-violet-300 transition-colors">Chat</Link>
            <a href="https://github.com/georgexu1118-ctrl/aaos"
              target="_blank" rel="noopener noreferrer"
              className="hover:text-violet-300 transition-colors">GitHub</a>
            <a href="https://openai.com" target="_blank" rel="noopener noreferrer"
              className="hover:text-violet-300 transition-colors">Powered by OpenAI</a>
          </div>
        </div>
      </footer>

      {/* ── Floating chat demo ───────────────────────────────────── */}
      <FloatingChat />
    </div>
  );
}
