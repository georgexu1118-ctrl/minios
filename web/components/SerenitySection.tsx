"use client";
import { ExternalLink, Sparkles } from "lucide-react";

function XLogo({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

export default function SerenitySection() {
  return (
    <section className="py-10 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Section header */}
        <div className="text-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-1.5">
            <span className="text-violet-100">Tracking</span>{" "}
            <span style={{
              background: "linear-gradient(135deg, #fbbf24 0%, #fb923c 50%, #f43f5e 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>Serenity</span>
          </h2>
          <p className="text-violet-400/60 text-xs max-w-lg mx-auto">
            The trader behind the AAOI thesis. AAOS monitors posts and overlays them on the live chart.
          </p>
        </div>

        {/* Trader card */}
        <div className="glass rounded-2xl p-4 md:p-5 mb-4"
          style={{ border: "1px solid rgba(251,191,36,0.2)" }}>

          <div className="flex items-center gap-4">

            {/* Avatar */}
            <a href="https://x.com/aleabitoreddit"
              target="_blank" rel="noopener noreferrer"
              className="flex-shrink-0 relative w-14 h-14 rounded-xl overflow-hidden group"
              style={{
                background: "linear-gradient(135deg, #fbbf24 0%, #fb923c 50%, #f43f5e 100%)",
                boxShadow: "0 0 24px rgba(251,146,60,0.35)",
                padding: "2px",
              }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://unavatar.io/x/aleabitoreddit?fallback=https://unavatar.io/twitter/aleabitoreddit"
                alt="Serenity (@aleabitoreddit)"
                className="w-full h-full rounded-[10px] object-cover bg-[#0a0420]
                  group-hover:scale-[1.04] transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
            </a>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-baseline gap-2 mb-0.5">
                <h3 className="text-base font-bold text-violet-50">Serenity</h3>
                <a href="https://x.com/aleabitoreddit"
                  target="_blank" rel="noopener noreferrer"
                  className="text-amber-400/80 hover:text-amber-300 text-xs font-mono
                    inline-flex items-center gap-1 transition-colors">
                  @aleabitoreddit <ExternalLink size={10} />
                </a>
              </div>
              <p className="text-violet-300/60 text-xs leading-relaxed mb-3">
                Called <span className="font-semibold text-amber-300">AAOI at $35</span>{" "}
                before its <span className="font-semibold"
                  style={{ background: "linear-gradient(90deg,#4ade80,#22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  +420% YTD run
                </span>{" "}
                in 2026.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-2">
                <a href="https://x.com/aleabitoreddit"
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                    text-xs font-medium text-[#0a0420]
                    transition-transform duration-200 hover:scale-[1.02]"
                  style={{
                    background: "linear-gradient(135deg, #fbbf24, #fb923c)",
                    boxShadow: "0 6px 20px rgba(251,146,60,0.25)",
                  }}>
                  <XLogo size={11} /> Follow on X
                </a>
                <a href="https://x.com/aleabitoreddit/with_replies"
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                    glass text-violet-300 text-xs font-medium">
                  <Sparkles size={11} /> Recent Posts
                </a>
              </div>
            </div>

            {/* Compact stats */}
            <div className="hidden md:flex flex-col gap-2 flex-shrink-0">
              {[
                { val: "+420%", label: "YTD Call" },
                { val: "Live",  label: "Tracking" },
              ].map(s => (
                <div key={s.label} className="text-right">
                  <p className="text-sm font-bold text-gradient leading-none">{s.val}</p>
                  <p className="text-[9px] text-violet-500/60 tracking-widest uppercase">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tracker tile grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {[
            { title: "Latest Thesis", body: "AAOI optical transceivers riding the AI-datacenter capex wave.", tag: "Live" },
            { title: "Conviction",    body: "Position size scaled into March 2026 breakout above $90.",         tag: "Live" },
            { title: "Risk Frame",    body: "Trailing stop on weekly close below 20-week moving average.",      tag: "Risk" },
          ].map(c => (
            <div key={c.title} className="glass rounded-xl p-3"
              style={{ border: "1px solid rgba(251,191,36,0.10)" }}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[9px] font-mono tracking-widest uppercase text-amber-400/70">{c.tag}</p>
                <Sparkles size={9} className="text-amber-400/30" />
              </div>
              <h4 className="text-xs font-bold text-violet-100 mb-0.5">{c.title}</h4>
              <p className="text-[11px] text-violet-400/55 leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-[9px] text-violet-500/30 mt-4 font-mono tracking-wider">
          Mirrors public posts from{" "}
          <a href="https://x.com/aleabitoreddit" target="_blank" rel="noopener noreferrer"
            className="text-amber-400/60 hover:text-amber-300 transition-colors">@aleabitoreddit</a>.
          Not trading advice.
        </p>
      </div>
    </section>
  );
}
