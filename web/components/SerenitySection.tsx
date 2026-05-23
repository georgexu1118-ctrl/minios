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
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Section header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            <span className="text-violet-100">Tracking</span>{" "}
            <span style={{
              background: "linear-gradient(135deg, #fbbf24 0%, #fb923c 50%, #f43f5e 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>Serenity</span>
          </h2>
          <p className="text-violet-400/70 text-sm md:text-base max-w-2xl mx-auto">
            The legendary trader behind the AAOI thesis. AAOS Research continuously
            monitors Serenity&apos;s posts and overlays them on the live chart.
          </p>
        </div>

        {/* Trader card */}
        <div className="glass rounded-3xl p-6 md:p-8 mb-6"
          style={{ border: "1px solid rgba(251,191,36,0.2)" }}>

          <div className="flex flex-col md:flex-row items-start gap-6">

            {/* Avatar — pulled live from X via unavatar.io */}
            <a href="https://x.com/aleabitoreddit"
              target="_blank" rel="noopener noreferrer"
              className="flex-shrink-0 relative w-20 h-20 md:w-24 md:h-24 rounded-2xl
                overflow-hidden animate-pulse-glow group"
              style={{
                background: "linear-gradient(135deg, #fbbf24 0%, #fb923c 50%, #f43f5e 100%)",
                boxShadow: "0 0 40px rgba(251,146,60,0.4)",
                padding: "2px",
              }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://unavatar.io/x/aleabitoreddit?fallback=https://unavatar.io/twitter/aleabitoreddit"
                alt="Serenity (@aleabitoreddit) on X"
                className="w-full h-full rounded-[14px] object-cover bg-[#0a0420]
                  group-hover:scale-[1.03] transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
            </a>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-baseline gap-2 mb-1">
                <h3 className="text-xl md:text-2xl font-bold text-violet-50">Serenity</h3>
                <a href="https://x.com/aleabitoreddit"
                  target="_blank" rel="noopener noreferrer"
                  className="text-amber-400/80 hover:text-amber-300 text-sm font-mono tracking-wider
                    inline-flex items-center gap-1 transition-colors">
                  @aleabitoreddit <ExternalLink size={11} />
                </a>
              </div>
              <p className="text-violet-300/70 text-sm leading-relaxed mb-4">
                Independent equity trader. Called <span className="font-semibold text-amber-300">AAOI at $35</span>{" "}
                before its <span className="font-semibold"
                  style={{ background: "linear-gradient(90deg,#4ade80,#22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  +420% YTD run
                </span>{" "}
                in 2026. Followed for technical setups, contrarian small-cap plays, and high-conviction conviction theses.
              </p>

              {/* Stat row */}
              <div className="flex flex-wrap gap-6 mb-5">
                {[
                  { val: "+420%",  label: "AAOI YTD Call" },
                  { val: "2026",   label: "Year of the Thesis" },
                  { val: "Live",   label: "Post Tracking" },
                ].map(s => (
                  <div key={s.label}>
                    <p className="text-lg font-bold text-gradient">{s.val}</p>
                    <p className="text-[10px] text-violet-500/60 tracking-widest uppercase">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-2">
                <a href="https://x.com/aleabitoreddit"
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
                    text-sm font-medium tracking-wide text-[#0a0420]
                    transition-transform duration-200 hover:scale-[1.02]"
                  style={{
                    background: "linear-gradient(135deg, #fbbf24, #fb923c)",
                    boxShadow: "0 10px 30px rgba(251,146,60,0.3)",
                  }}>
                  <XLogo size={13} /> Follow on X
                </a>
                <a href="https://x.com/aleabitoreddit/with_replies"
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
                    glass glow-hover text-violet-300 text-sm font-medium tracking-wide">
                  <Sparkles size={14} /> Recent Posts
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Tracker tile grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { title: "Latest Thesis", body: "AAOI optical transceivers riding the AI-datacenter capex wave.", tag: "Open" },
            { title: "Conviction",    body: "Position size scaled into March 2026 breakout above $90.",         tag: "Live" },
            { title: "Risk Frame",    body: "Trailing stop on weekly close below 20-week moving average.",      tag: "Risk" },
          ].map(c => (
            <div key={c.title} className="glass rounded-2xl p-4"
              style={{ border: "1px solid rgba(251,191,36,0.12)" }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-mono tracking-widest uppercase text-amber-400/70">{c.tag}</p>
                <Sparkles size={11} className="text-amber-400/40" />
              </div>
              <h4 className="text-sm font-bold text-violet-100 mb-1">{c.title}</h4>
              <p className="text-xs text-violet-400/60 leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>

        {/* X embed pointer */}
        <p className="text-center text-[10px] text-violet-500/40 mt-6 font-mono tracking-wider">
          AAOS Research mirrors public posts from <a href="https://x.com/aleabitoreddit" target="_blank" rel="noopener noreferrer"
            className="text-amber-400/70 hover:text-amber-300 transition-colors">@aleabitoreddit</a>.
          We do not provide trading advice.
        </p>
      </div>
    </section>
  );
}
