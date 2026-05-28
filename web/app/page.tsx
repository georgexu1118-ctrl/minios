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
  ExternalLink,
  Search,
  Sparkles,
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

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050607] text-white">
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

      <main className="relative z-10 px-5 pb-20 pt-28 md:px-9 lg:px-12">
        <section className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.22em] text-zinc-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,.9)]" />
                AAOS model lab
              </div>

              <h1 className="text-4xl font-semibold tracking-[-0.04em] text-white md:text-6xl">
                Welcome to AAOS Research
              </h1>
              <p className="mt-4 max-w-xl text-lg text-zinc-400 md:text-xl">
                Advanced AI models for reasoning, coding, education, live research, and document intelligence.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="https://github.com/georgexu1118-ctrl/aaos"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-zinc-100 shadow-2xl shadow-black/20 transition hover:border-white/20 hover:bg-white/[0.08]"
              >
                <ExternalLink size={16} /> GitHub
              </a>
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/15 px-4 py-3 text-sm font-semibold text-violet-100 shadow-2xl shadow-violet-950/40 transition hover:bg-violet-500/25"
              >
                Launch AI <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div className="mt-16 flex flex-wrap gap-4">
            {filters.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  className={`inline-flex items-center gap-3 rounded-2xl border px-5 py-4 text-sm font-medium transition ${
                    item.active
                      ? "border-white/10 bg-white/[0.07] text-white shadow-2xl shadow-black/20"
                      : "border-transparent bg-transparent text-zinc-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-zinc-200"
                  }`}
                >
                  <Icon size={19} className={item.active ? "text-zinc-100" : "text-zinc-500"} />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="mt-7 grid gap-5 lg:grid-cols-12">
            {labs.map(card => (
              <article
                key={card.title}
                className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0c0e10]/80 p-7 shadow-2xl shadow-black/30 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/20 ${
                  card.featured ? "lg:col-span-6" : "lg:col-span-3"
                }`}
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.08),transparent_28%)] opacity-0 transition group-hover:opacity-100" />
                <div className="relative z-10 flex h-full min-h-[360px] flex-col">
                  <span className="mb-8 w-fit rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">
                    {card.badge}
                  </span>

                  <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">
                    {card.title}
                  </h2>
                  <p className="mt-5 max-w-sm text-base leading-7 text-zinc-400">
                    {card.description}
                  </p>

                  {card.featured && (
                    <div className="pointer-events-none absolute bottom-16 right-4 hidden h-56 w-56 md:block">
                      <div className="absolute inset-0 rounded-full bg-violet-500/15 blur-3xl" />
                      <Image
                        src="/galileo-moon.webp"
                        alt="AAOS research mascot"
                        width={224}
                        height={224}
                        className="relative h-full w-full rounded-full object-cover object-top opacity-90 saturate-150"
                        style={{
                          filter: "sepia(1) hue-rotate(222deg) saturate(2.1) brightness(0.72) contrast(1.25)",
                        }}
                      />
                      <Sparkles className="absolute right-8 top-5 text-pink-300 drop-shadow-[0_0_10px_rgba(249,168,212,.9)]" size={20} />
                      <Sparkles className="absolute right-2 top-14 text-pink-300 drop-shadow-[0_0_10px_rgba(249,168,212,.9)]" size={14} />
                    </div>
                  )}

                  <Link
                    href={card.href}
                    className={`mt-auto inline-flex w-full items-center justify-center rounded-xl border px-5 py-3 text-sm font-semibold transition ${
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

        <section className="mx-auto mt-24 max-w-7xl">
          <div className="grid gap-5 lg:grid-cols-12">
            <article className="relative overflow-hidden rounded-2xl border border-cyan-300/15 bg-[#0c0e10]/80 shadow-2xl shadow-black/30 backdrop-blur-xl lg:col-span-7">
              <div className="relative">
                <Image
                  src="/aaoi-chart.png"
                  alt="AAOI stock chart showing YTD performance"
                  width={900}
                  height={480}
                  className="h-[320px] w-full object-cover object-top opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e10] via-[#0c0e10]/20 to-transparent" />
                <div className="absolute left-6 top-6 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-200">
                  AAOI live context
                </div>
              </div>
            </article>

            <article className="rounded-2xl border border-white/10 bg-[#0c0e10]/80 p-7 shadow-2xl shadow-black/30 backdrop-blur-xl lg:col-span-5">
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-cyan-300/70">
                Origin Signal
              </p>
              <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-white">
                AAOI stays part of the lab.
              </h2>
              <p className="mt-5 text-base leading-7 text-zinc-400">
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
