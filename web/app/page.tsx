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

function BabyYoda({ className = "" }: { className?: string }) {
  return (
    <div className={className} style={{ animation: "yoda-float 3.4s ease-in-out infinite" }}>
      <svg viewBox="0 0 140 168" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="headGrad" cx="42%" cy="38%" r="60%">
            <stop offset="0%" stopColor="#80d040"/>
            <stop offset="100%" stopColor="#4a9018"/>
          </radialGradient>
          <radialGradient id="eyeGrad" cx="38%" cy="35%" r="55%">
            <stop offset="0%" stopColor="#2a1400"/>
            <stop offset="100%" stopColor="#0a0500"/>
          </radialGradient>
          <radialGradient id="robeGrad" cx="50%" cy="20%" r="70%">
            <stop offset="0%" stopColor="#8a6535"/>
            <stop offset="100%" stopColor="#5a3f1a"/>
          </radialGradient>
        </defs>

        {/* Robe shadow / depth */}
        <path d="M38 108 Q18 140 14 165 L126 165 Q122 140 102 108 Q70 124 38 108 Z" fill="#3e2a0e"/>
        {/* Robe main */}
        <path d="M40 107 Q22 138 18 163 L122 163 Q118 138 100 107 Q70 122 40 107 Z" fill="url(#robeGrad)"/>
        {/* Robe inner fold highlight */}
        <path d="M52 112 Q46 138 44 163 L96 163 Q94 138 88 112 Q70 121 52 112 Z" fill="#7a5a2a" opacity="0.55"/>
        {/* Robe center crease */}
        <path d="M70 115 Q68 138 70 163" stroke="#4a3015" strokeWidth="1.2" fill="none" opacity="0.5"/>

        {/* Collar */}
        <ellipse cx="70" cy="107" rx="14" ry="8" fill="#5a9e28"/>
        <ellipse cx="70" cy="106" rx="11" ry="6" fill="#6ab030"/>

        {/* LEFT EAR — wide, drooping leaf shape */}
        <path d="M36 62 Q22 50 4 62 Q-4 76 8 86 Q18 92 32 84 Q40 76 38 66 Z" fill="#5fa832"/>
        <path d="M34 64 Q23 54 7 64 Q1 75 11 83 Q19 88 31 81 Q38 74 36 67 Z" fill="#b87060"/>
        {/* Ear vein line */}
        <path d="M34 66 Q20 68 10 75" stroke="#4a7020" strokeWidth="0.8" fill="none" opacity="0.4"/>

        {/* RIGHT EAR — mirror */}
        <path d="M104 62 Q118 50 136 62 Q144 76 132 86 Q122 92 108 84 Q100 76 102 66 Z" fill="#5fa832"/>
        <path d="M106 64 Q117 54 133 64 Q139 75 129 83 Q121 88 109 81 Q102 74 104 67 Z" fill="#b87060"/>
        <path d="M106 66 Q120 68 130 75" stroke="#4a7020" strokeWidth="0.8" fill="none" opacity="0.4"/>

        {/* Head */}
        <ellipse cx="70" cy="68" rx="38" ry="36" fill="url(#headGrad)"/>
        {/* Cheek blush */}
        <ellipse cx="46" cy="78" rx="10" ry="6" fill="#5aaa22" opacity="0.3"/>
        <ellipse cx="94" cy="78" rx="10" ry="6" fill="#5aaa22" opacity="0.3"/>

        {/* Forehead wrinkles */}
        <path d="M53 48 Q70 44 87 48" stroke="#3a7010" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.55"/>
        <path d="M57 55 Q70 52 83 55" stroke="#3a7010" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.38"/>

        {/* LEFT EYE */}
        <circle cx="51" cy="69" r="13" fill="#0e0700"/>
        <circle cx="51" cy="69" r="11" fill="url(#eyeGrad)"/>
        {/* Eye shine main */}
        <circle cx="56" cy="63" r="4.5" fill="white" opacity="0.92"/>
        {/* Eye shine secondary */}
        <circle cx="48" cy="74" r="2" fill="white" opacity="0.3"/>

        {/* RIGHT EYE */}
        <circle cx="89" cy="69" r="13" fill="#0e0700"/>
        <circle cx="89" cy="69" r="11" fill="url(#eyeGrad)"/>
        <circle cx="94" cy="63" r="4.5" fill="white" opacity="0.92"/>
        <circle cx="86" cy="74" r="2" fill="white" opacity="0.3"/>

        {/* Nose — tiny, upturned */}
        <ellipse cx="70" cy="82" rx="5.5" ry="3.5" fill="#3e7a10" opacity="0.75"/>
        <circle cx="67" cy="81" r="1.6" fill="#2e5c0a" opacity="0.55"/>
        <circle cx="73" cy="81" r="1.6" fill="#2e5c0a" opacity="0.55"/>

        {/* Mouth — gentle happy curve */}
        <path d="M58 92 Q70 101 82 92" stroke="#2e5c0a" strokeWidth="2.2" fill="none" strokeLinecap="round"/>

        {/* Tiny arms / hands peeking from robe */}
        <path d="M32 130 Q22 124 24 114 Q30 106 38 115 L35 130 Z" fill="#5fa832"/>
        <ellipse cx="30" cy="132" rx="8" ry="5.5" fill="#6ab83a" transform="rotate(-20 30 132)"/>
        <path d="M108 130 Q118 124 116 114 Q110 106 102 115 L105 130 Z" fill="#5fa832"/>
        <ellipse cx="110" cy="132" rx="8" ry="5.5" fill="#6ab83a" transform="rotate(20 110 132)"/>

        {/* Finger lines */}
        <line x1="25" y1="130" x2="28" y2="136" stroke="#3a7010" strokeWidth="0.9" opacity="0.5"/>
        <line x1="31" y1="129" x2="33" y2="136" stroke="#3a7010" strokeWidth="0.9" opacity="0.5"/>
        <line x1="109" y1="129" x2="107" y2="136" stroke="#3a7010" strokeWidth="0.9" opacity="0.5"/>
        <line x1="115" y1="130" x2="113" y2="136" stroke="#3a7010" strokeWidth="0.9" opacity="0.5"/>
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
                      <BabyYoda className="relative w-40 drop-shadow-[0_0_28px_rgba(16,185,129,.4)]" />
                      {/* Floating stars */}
                      <svg className="absolute -top-3 right-10" width="18" height="18" viewBox="0 0 24 24" fill="#a78bfa" style={{ filter: "drop-shadow(0 0 7px #a78bfa)", animation: "star-float-1 3.6s ease-in-out infinite" }}><polygon points="12,2 13.9,8.6 21,9.3 15.9,14 17.6,21 12,17.5 6.4,21 8.1,14 3,9.3 10.1,8.6"/></svg>
                      <svg className="absolute top-6 -right-3" width="13" height="13" viewBox="0 0 24 24" fill="#22d3ee" style={{ filter: "drop-shadow(0 0 5px #22d3ee)", animation: "star-float-2 4.4s ease-in-out infinite 0.7s" }}><polygon points="12,2 13.9,8.6 21,9.3 15.9,14 17.6,21 12,17.5 6.4,21 8.1,14 3,9.3 10.1,8.6"/></svg>
                      <svg className="absolute -top-5 right-2" width="10" height="10" viewBox="0 0 24 24" fill="#fbbf24" style={{ filter: "drop-shadow(0 0 4px #fbbf24)", animation: "star-float-3 5s ease-in-out infinite 1.2s" }}><polygon points="12,2 13.9,8.6 21,9.3 15.9,14 17.6,21 12,17.5 6.4,21 8.1,14 3,9.3 10.1,8.6"/></svg>
                      <svg className="absolute top-20 -right-4" width="15" height="15" viewBox="0 0 24 24" fill="#c084fc" style={{ filter: "drop-shadow(0 0 6px #c084fc)", animation: "star-float-1 4.8s ease-in-out infinite 1.8s" }}><polygon points="12,2 13.9,8.6 21,9.3 15.9,14 17.6,21 12,17.5 6.4,21 8.1,14 3,9.3 10.1,8.6"/></svg>
                      <svg className="absolute -top-1 left-2" width="11" height="11" viewBox="0 0 24 24" fill="#67e8f9" style={{ filter: "drop-shadow(0 0 4px #67e8f9)", animation: "star-float-2 3.8s ease-in-out infinite 0.4s" }}><polygon points="12,2 13.9,8.6 21,9.3 15.9,14 17.6,21 12,17.5 6.4,21 8.1,14 3,9.3 10.1,8.6"/></svg>
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
                <div className="absolute left-6 top-6 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-200">
                  AAOI live context
                </div>
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
