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
    <div className={className}>
      <svg viewBox="0 0 170 145" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <radialGradient id="mascotGlow" cx="50%" cy="44%" r="62%">
            <stop offset="0%" stopColor="#d8ffd2" stopOpacity="0.95" />
            <stop offset="48%" stopColor="#7fcf68" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#2d6b2e" stopOpacity="0.95" />
          </radialGradient>
          <linearGradient id="robeFront" x1="31" x2="128" y1="82" y2="140" gradientUnits="userSpaceOnUse">
            <stop stopColor="#c9b08e" />
            <stop offset="0.55" stopColor="#8f7657" />
            <stop offset="1" stopColor="#5b4935" />
          </linearGradient>
          <linearGradient id="robeShadow" x1="51" x2="111" y1="93" y2="144" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8a6c45" />
            <stop offset="1" stopColor="#3f2d1e" />
          </linearGradient>
          <radialGradient id="eyeShine" cx="35%" cy="28%" r="70%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="34%" stopColor="#ffffff" stopOpacity="0.7" />
            <stop offset="36%" stopColor="#17110d" />
            <stop offset="100%" stopColor="#050302" />
          </radialGradient>
        </defs>

        <ellipse cx="86" cy="92" rx="78" ry="47" fill="#34d399" opacity="0.13" />
        <path d="M40 88 C55 78 113 78 130 88 L142 142 H27 Z" fill="url(#robeFront)" />
        <path d="M67 91 C74 96 91 96 101 91 L111 142 H55 Z" fill="url(#robeShadow)" opacity="0.72" />
        <path d="M38 95 C53 86 116 86 131 95 L126 110 C100 101 68 101 43 110 Z" fill="#d6c1a4" />

        <path d="M42 74 C26 64 15 45 23 35 C33 24 64 38 75 53 Z" fill="#79c466" />
        <path d="M128 74 C144 64 155 45 147 35 C137 24 106 38 95 53 Z" fill="#79c466" />
        <path d="M32 43 C41 37 58 42 68 53 C55 54 40 58 29 65 C24 57 25 48 32 43 Z" fill="#cf927f" opacity="0.82" />
        <path d="M138 43 C129 37 112 42 102 53 C115 54 130 58 141 65 C146 57 145 48 138 43 Z" fill="#cf927f" opacity="0.82" />

        <ellipse cx="85" cy="56" rx="42" ry="36" fill="url(#mascotGlow)" />
        <path d="M62 37 C72 32 97 32 108 37" stroke="#4f9b3f" strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
        <path d="M67 45 C77 41 94 41 103 45" stroke="#4f9b3f" strokeWidth="2" strokeLinecap="round" opacity="0.42" />

        <ellipse cx="67" cy="61" rx="13.5" ry="15" fill="url(#eyeShine)" />
        <ellipse cx="103" cy="61" rx="13.5" ry="15" fill="url(#eyeShine)" />
        <circle cx="71" cy="54" r="4.5" fill="#fff" opacity="0.92" />
        <circle cx="107" cy="54" r="4.5" fill="#fff" opacity="0.92" />
        <ellipse cx="85" cy="74" rx="6" ry="4" fill="#3b7d28" opacity="0.85" />
        <path d="M72 84 C80 91 92 91 100 84" stroke="#2f6822" strokeWidth="3" strokeLinecap="round" fill="none" />

        <path d="M34 98 C19 91 15 78 22 71 C31 62 43 75 47 91 Z" fill="#82c85e" />
        <circle cx="25" cy="72" r="5" fill="#a3df72" />
        <path d="M129 95 C142 92 151 101 147 111 C143 122 126 116 121 102 Z" fill="#82c85e" />
        <path d="M129 95 C136 96 142 102 144 109" stroke="#4b8f37" strokeWidth="2" strokeLinecap="round" />
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
