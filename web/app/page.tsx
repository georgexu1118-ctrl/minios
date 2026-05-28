"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Box,
  Brain,
  Code2,
  Search,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import NebulaLayers from "@/components/NebulaLayers";
import FloatingChat from "@/components/FloatingChat";
import NeptuneMuseum from "@/components/NeptuneMuseum";

const StarField = dynamic(() => import("@/components/StarField"), { ssr: false });
const FloatingAaoiTicker = dynamic(() => import("@/components/FloatingAaoiTicker"), { ssr: false });

const filters = [
  { label: "All Models", icon: Box, active: true },
  { label: "Reasoning", icon: Brain },
  { label: "Coding", icon: Code2 },
  { label: "Educational", icon: BookOpen },
  { label: "Search", icon: Search },
];

const labs = [
  {
    title: "Reasoning Models",
    description: "Frontier planning, research synthesis, live market questions, and deep problem solving.",
    button: "Explore Models",
    href: "/chat",
    tone: "blue",
    badge: "Kimi K2",
  },
  {
    title: "Coding Models",
    description: "NousCoder-14B for code generation, analysis, debugging, and precise developer workflows.",
    button: "Try NousCoder",
    href: "/chat",
    tone: "emerald",
    badge: "NousCoder-14B",
  },
  {
    title: "Educational Models",
    description: "Step-by-step tutoring, olympiad math, screenshots, PDFs, and study flashcards.",
    button: "Launch Tutor",
    href: "/chat",
    tone: "violet",
    badge: "GPT-OSS 20B",
    featured: true,
  },
];

function TutorMascot({ className = "" }: { className?: string }) {
  return (
    <div className={className} style={{ animation: "yoda-float 3.6s ease-in-out infinite" }}>
      <svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <radialGradient id="grHead" cx="38%" cy="32%" r="68%">
            <stop offset="0%"  stopColor="#a8d870"/>
            <stop offset="35%" stopColor="#7cba3a"/>
            <stop offset="75%" stopColor="#558d20"/>
            <stop offset="100%" stopColor="#345d10"/>
          </radialGradient>
          <radialGradient id="grEarOut" cx="35%" cy="30%" r="75%">
            <stop offset="0%"  stopColor="#8cc650"/>
            <stop offset="60%" stopColor="#5fa030"/>
            <stop offset="100%" stopColor="#3a7015"/>
          </radialGradient>
          <radialGradient id="grEarIn" cx="40%" cy="40%" r="60%">
            <stop offset="0%"  stopColor="#e8b8a8"/>
            <stop offset="60%" stopColor="#c08070"/>
            <stop offset="100%" stopColor="#8a5448"/>
          </radialGradient>
          <radialGradient id="grEye" cx="38%" cy="32%" r="65%">
            <stop offset="0%"  stopColor="#3a2410"/>
            <stop offset="60%" stopColor="#150900"/>
            <stop offset="100%" stopColor="#000000"/>
          </radialGradient>
          <linearGradient id="grRobe" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"  stopColor="#c9b08e"/>
            <stop offset="50%" stopColor="#8f7657"/>
            <stop offset="100%" stopColor="#4a3318"/>
          </linearGradient>
          <linearGradient id="grRobeFold" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"  stopColor="#d8c4a0"/>
            <stop offset="100%" stopColor="#7a5e38"/>
          </linearGradient>
          <radialGradient id="grCheek" cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stopColor="#a8d870" stopOpacity="0.55"/>
            <stop offset="100%" stopColor="#a8d870" stopOpacity="0"/>
          </radialGradient>
          <filter id="grSoft" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2.5"/>
            <feOffset dx="0" dy="2.5"/>
            <feComponentTransfer><feFuncA type="linear" slope="0.45"/></feComponentTransfer>
            <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Robe */}
        <path d="M54 150 Q34 175 24 222 Q24 228 32 228 L168 228 Q176 228 176 222 Q166 175 146 150 Q100 168 54 150 Z" fill="#2e1d08"/>
        <path d="M56 148 Q38 174 28 222 L172 222 Q162 174 144 148 Q100 165 56 148 Z" fill="url(#grRobe)"/>
        <path d="M72 156 Q62 180 58 220 L142 220 Q138 180 128 156 Q100 168 72 156 Z" fill="url(#grRobeFold)" opacity="0.6"/>
        <path d="M100 160 Q98 188 100 222" stroke="#3a2710" strokeWidth="1.8" fill="none" opacity="0.55"/>
        <path d="M75 162 Q70 188 65 215" stroke="#3a2710" strokeWidth="1" fill="none" opacity="0.35"/>
        <path d="M125 162 Q130 188 135 215" stroke="#3a2710" strokeWidth="1" fill="none" opacity="0.35"/>

        {/* Collar */}
        <ellipse cx="100" cy="148" rx="22" ry="12" fill="#3a2710"/>
        <ellipse cx="100" cy="146" rx="18" ry="9" fill="#5a9028"/>
        <ellipse cx="100" cy="145" rx="14" ry="7" fill="#6ab030"/>

        {/* Ears */}
        <g filter="url(#grSoft)">
          <path d="M52 88 Q34 70 8 80 Q-6 96 4 116 Q18 130 42 122 Q56 112 56 96 Z" fill="url(#grEarOut)"/>
          <path d="M50 92 Q36 78 14 86 Q4 100 12 114 Q22 124 42 117 Q52 109 53 98 Z" fill="url(#grEarIn)"/>
          <path d="M44 100 Q34 96 24 102 Q22 110 30 114" stroke="#a87060" strokeWidth="1.2" fill="none" opacity="0.6"/>
          <path d="M50 89 Q36 74 16 80" stroke="#b8e070" strokeWidth="1.2" fill="none" opacity="0.55" strokeLinecap="round"/>
        </g>
        <g filter="url(#grSoft)">
          <path d="M148 88 Q166 70 192 80 Q206 96 196 116 Q182 130 158 122 Q144 112 144 96 Z" fill="url(#grEarOut)"/>
          <path d="M150 92 Q164 78 186 86 Q196 100 188 114 Q178 124 158 117 Q148 109 147 98 Z" fill="url(#grEarIn)"/>
          <path d="M156 100 Q166 96 176 102 Q178 110 170 114" stroke="#a87060" strokeWidth="1.2" fill="none" opacity="0.6"/>
          <path d="M150 89 Q164 74 184 80" stroke="#b8e070" strokeWidth="1.2" fill="none" opacity="0.55" strokeLinecap="round"/>
        </g>

        {/* Head */}
        <ellipse cx="100" cy="148" rx="58" ry="14" fill="#1a3008" opacity="0.5"/>
        <ellipse cx="100" cy="92" rx="58" ry="56" fill="url(#grHead)"/>
        <circle cx="62" cy="108" r="14" fill="url(#grCheek)"/>
        <circle cx="138" cy="108" r="14" fill="url(#grCheek)"/>

        {/* Wrinkles */}
        <path d="M72 60 Q100 54 128 60" stroke="#3a6810" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.55"/>
        <path d="M76 69 Q100 65 124 69" stroke="#3a6810" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.42"/>
        <path d="M82 77 Q100 74 118 77" stroke="#3a6810" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.28"/>
        <ellipse cx="100" cy="135" rx="38" ry="10" fill="#3a6810" opacity="0.25"/>

        {/* Eye sockets */}
        <ellipse cx="72" cy="95" rx="20" ry="18" fill="#3a6810" opacity="0.3"/>
        <ellipse cx="128" cy="95" rx="20" ry="18" fill="#3a6810" opacity="0.3"/>

        {/* Eyes */}
        <circle cx="72" cy="96" r="18" fill="#0a0500"/>
        <circle cx="72" cy="96" r="16" fill="url(#grEye)"/>
        <ellipse cx="79" cy="88" rx="6" ry="5" fill="white" opacity="0.95"/>
        <circle cx="68" cy="92" r="2" fill="white" opacity="0.7"/>
        <ellipse cx="70" cy="106" rx="6" ry="2" fill="white" opacity="0.18"/>

        <circle cx="128" cy="96" r="18" fill="#0a0500"/>
        <circle cx="128" cy="96" r="16" fill="url(#grEye)"/>
        <ellipse cx="135" cy="88" rx="6" ry="5" fill="white" opacity="0.95"/>
        <circle cx="124" cy="92" r="2" fill="white" opacity="0.7"/>
        <ellipse cx="126" cy="106" rx="6" ry="2" fill="white" opacity="0.18"/>

        {/* Nose */}
        <ellipse cx="100" cy="115" rx="7" ry="4.5" fill="#3a6810" opacity="0.7"/>
        <ellipse cx="100" cy="114" rx="6" ry="3.8" fill="#4a8020" opacity="0.55"/>
        <circle cx="96" cy="114" r="1.6" fill="#1f3a05" opacity="0.7"/>
        <circle cx="104" cy="114" r="1.6" fill="#1f3a05" opacity="0.7"/>

        {/* Mouth */}
        <path d="M84 128 Q100 140 116 128" stroke="#5a3225" strokeWidth="3.2" fill="none" strokeLinecap="round" opacity="0.85"/>
        <path d="M86 127 Q100 138 114 127" stroke="#7a4830" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.5"/>

        {/* Arms */}
        <ellipse cx="46" cy="190" rx="14" ry="9" fill="url(#grHead)" transform="rotate(-15 46 190)"/>
        <ellipse cx="44" cy="192" rx="10" ry="6.5" fill="#6ab83a" transform="rotate(-15 44 192)"/>
        <line x1="36" y1="190" x2="40" y2="198" stroke="#3a6810" strokeWidth="1.1" opacity="0.55"/>
        <line x1="42" y1="187" x2="45" y2="196" stroke="#3a6810" strokeWidth="1.1" opacity="0.55"/>
        <line x1="49" y1="186" x2="51" y2="196" stroke="#3a6810" strokeWidth="1.1" opacity="0.55"/>

        {/* Right arm raised — waving */}
        <ellipse cx="160" cy="170" rx="14" ry="9" fill="url(#grHead)" transform="rotate(35 160 170)"/>
        <ellipse cx="162" cy="168" rx="10" ry="6.5" fill="#6ab83a" transform="rotate(35 162 168)"/>
        <line x1="156" y1="160" x2="160" y2="168" stroke="#3a6810" strokeWidth="1.1" opacity="0.55"/>
        <line x1="162" y1="158" x2="165" y2="167" stroke="#3a6810" strokeWidth="1.1" opacity="0.55"/>
        <line x1="168" y1="160" x2="170" y2="169" stroke="#3a6810" strokeWidth="1.1" opacity="0.55"/>
      </svg>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#050607] text-white">
      <StarField />
      <NebulaLayers />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(80,120,255,0.16),transparent_28%),radial-gradient(circle_at_86%_72%,rgba(124,58,237,0.18),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent_24%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.55) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.55) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      <Navbar />

      <main className="relative z-10 px-5 pb-14 pt-24 md:px-9 lg:px-12">
        <section className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,.9)]" />
                AAOS model lab
              </div>

              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white md:text-5xl">
                Welcome to AAOS Research
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400 md:text-base">
                Advanced AI models for reasoning, coding, education, live research, and document intelligence.
              </p>
            </div>

          </div>

          <div className="mt-9 flex flex-wrap gap-3">
            {filters.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  className={`inline-flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-xs font-medium transition ${
                    item.active
                      ? "border-white/10 bg-white/[0.07] text-white shadow-2xl shadow-black/20"
                      : "border-transparent bg-transparent text-zinc-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-zinc-200"
                  }`}
                >
                  <Icon size={16} className={item.active ? "text-zinc-100" : "text-zinc-500"} />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="mt-7 grid gap-5 lg:grid-cols-12">
            {labs.map(card => (
              <article
                key={card.title}
                className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0c0e10]/80 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/20 ${
                  card.featured ? "lg:col-span-6" : "lg:col-span-3"
                }`}
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.08),transparent_28%)] opacity-0 transition group-hover:opacity-100" />
                <div className="relative z-10 flex h-full min-h-[250px] flex-col">
                  <span className="mb-5 w-fit rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] font-mono uppercase tracking-[0.18em] text-zinc-500">
                    {card.badge}
                  </span>

                  <h2 className="text-xl font-semibold tracking-[-0.03em] text-white">
                    {card.title}
                  </h2>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-400">
                    {card.description}
                  </p>

                  {card.featured && (
                    <div className="pointer-events-none absolute bottom-8 right-6 hidden md:block">
                      <div className="absolute inset-0 rounded-full bg-emerald-400/10 blur-3xl" />
                      <TutorMascot className="relative w-44 drop-shadow-[0_0_24px_rgba(16,185,129,.3)]" />
                      <svg className="absolute -top-2 right-8" width="16" height="16" viewBox="0 0 24 24" fill="#a78bfa" style={{ filter: "drop-shadow(0 0 6px #a78bfa)" }}><polygon points="12,2 13.9,8.6 21,9.3 15.9,14 17.6,21 12,17.5 6.4,21 8.1,14 3,9.3 10.1,8.6"/></svg>
                      <svg className="absolute top-8 -right-2" width="12" height="12" viewBox="0 0 24 24" fill="#22d3ee" style={{ filter: "drop-shadow(0 0 5px #22d3ee)" }}><polygon points="12,2 13.9,8.6 21,9.3 15.9,14 17.6,21 12,17.5 6.4,21 8.1,14 3,9.3 10.1,8.6"/></svg>
                      <svg className="absolute -top-4 right-1" width="9" height="9" viewBox="0 0 24 24" fill="#fbbf24" style={{ filter: "drop-shadow(0 0 4px #fbbf24)" }}><polygon points="12,2 13.9,8.6 21,9.3 15.9,14 17.6,21 12,17.5 6.4,21 8.1,14 3,9.3 10.1,8.6"/></svg>
                    </div>
                  )}

                  <Link
                    href={card.href}
                    className={`mt-auto inline-flex w-full items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                      card.tone === "blue"
                        ? "border-blue-400/25 bg-blue-500/10 text-blue-100 hover:bg-blue-500/20"
                        : card.tone === "emerald"
                          ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20"
                          : "border-violet-400/25 bg-violet-500/15 text-violet-100 hover:bg-violet-500/25"
                    }`}
                  >
                    {card.button}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-10 max-w-7xl">
          <div className="grid gap-5 lg:grid-cols-12">
            <article className="relative overflow-hidden rounded-2xl border border-cyan-300/15 bg-[#0c0e10]/80 shadow-2xl shadow-black/30 backdrop-blur-xl lg:col-span-7">
              <div className="relative">
                <Image
                  src="/aaoi-chart.png"
                  alt="AAOI stock chart showing YTD performance"
                  width={900}
                  height={480}
                  className="h-[240px] w-full object-cover object-top opacity-90 md:h-[280px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e10] via-[#0c0e10]/20 to-transparent" />
              </div>
            </article>

            <article className="rounded-2xl border border-white/10 bg-[#0c0e10]/80 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl lg:col-span-5">
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-cyan-300/70">
                Origin Signal
              </p>
              <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-white">
                AAOI stays part of the lab.
              </h2>
              <p className="mt-4 text-sm leading-6 text-zinc-400">
                AAOS keeps live market intelligence close to the model workspace, including the AAOI story that inspired the project name.
              </p>
              <Link
                href="/chat"
                className="mt-8 inline-flex items-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Ask about AAOI <ArrowRight size={16} />
              </Link>
            </article>
          </div>
        </section>

        <NeptuneMuseum />
      </main>

      <FloatingChat />
      <FloatingAaoiTicker />
    </div>
  );
}
