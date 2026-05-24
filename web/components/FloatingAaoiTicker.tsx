"use client";
import { useEffect, useRef, useState } from "react";
import { TrendingUp, X, BarChart3 } from "lucide-react";

interface Candle { t: number; o: number; h: number; l: number; c: number; }
interface ChartData {
  symbol: string;
  last: number;
  prevClose: number;
  change: number;
  changePct: number;
  points: Candle[];
}

const POLL_MS = 60_000;          // refresh every minute
const VISIBLE = 24;              // number of candles to show
const RANGE = "1mo";             // 1 month of daily candles
const INTERVAL = "1d";

export default function FloatingAaoiTicker() {
  const [data, setData] = useState<ChartData | null>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const fetchOnce = async () => {
      try {
        const res = await fetch(`/api/chart?symbol=AAOI&range=${RANGE}&interval=${INTERVAL}`);
        if (!res.ok) return;
        const d = await res.json() as ChartData;
        if (!cancelled && d.points?.length) setData(d);
      } catch { /* swallow */ }
    };
    fetchOnce();
    timer.current = setInterval(fetchOnce, POLL_MS);
    return () => {
      cancelled = true;
      if (timer.current) clearInterval(timer.current);
    };
  }, [open]);

  // Slice the most recent VISIBLE candles
  const candles = (data?.points ?? []).slice(-VISIBLE);
  const isUp = (data?.change ?? 0) >= 0;
  const upColor   = "#4ade80";
  const downColor = "#f87171";
  const upGlow    = "rgba(74,222,128,0.55)";

  // SVG geometry
  const W = 240;
  const H = 90;
  const PAD_X = 6;
  const PAD_Y = 6;
  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_Y * 2;
  const slotW  = candles.length ? innerW / candles.length : 0;
  const candleW = Math.max(2, slotW * 0.62);

  let minY = 0, maxY = 0;
  if (candles.length) {
    minY = Math.min(...candles.map(c => c.l));
    maxY = Math.max(...candles.map(c => c.h));
  }
  const rangeY = (maxY - minY) || 1;
  const yPx = (v: number) => PAD_Y + innerH - ((v - minY) / rangeY) * innerH;

  if (!mounted) return null;

  return (
    <>
      {/* Floating ticker — bottom-left, very small */}
      <div
        className={`fixed bottom-6 left-6 z-50 w-[260px]
          glass-hi rounded-2xl shadow-2xl overflow-hidden
          transition-all duration-300 origin-bottom-left
          ${open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}`}
        style={{
          border: `1px solid ${isUp ? "rgba(74,222,128,0.28)" : "rgba(248,113,113,0.28)"}`,
          boxShadow: open
            ? `0 0 40px ${isUp ? "rgba(74,222,128,0.22)" : "rgba(248,113,113,0.22)"}, 0 12px 40px rgba(0,0,0,0.5)`
            : "none",
        }}>

        {/* Header strip */}
        <div className="flex items-center justify-between px-3 py-2 border-b"
          style={{ borderColor: "rgba(120,60,240,0.18)" }}>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            <span className="text-[10px] font-mono tracking-widest text-violet-300/80 uppercase">
              AAOI · Live
            </span>
          </div>
          <button onClick={() => setOpen(false)}
            aria-label="Hide ticker"
            className="p-1 rounded-md text-violet-400/40 hover:text-violet-200 cursor-pointer
              hover:bg-violet-900/30 transition-colors">
            <X size={11} />
          </button>
        </div>

        {/* Price row */}
        <div className="px-3 pt-2 pb-1 flex items-baseline justify-between">
          <p className="text-base font-bold text-violet-50">
            ${data?.last?.toFixed(2) ?? "—"}
          </p>
          {data && (
            <p className="text-[10px] font-semibold flex items-center gap-1"
              style={{ color: isUp ? upColor : downColor }}>
              <TrendingUp size={9} style={{ transform: isUp ? "" : "rotate(180deg)" }} />
              {data.change >= 0 ? "+" : ""}{data.changePct?.toFixed(2)}%
            </p>
          )}
        </div>

        {/* Candles */}
        <div className="px-1 pb-2">
          {candles.length ? (
            <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}
              className="w-full h-auto overflow-visible">
              <defs>
                <linearGradient id="aaoi-mini-bg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"  stopColor={upGlow} stopOpacity="0.18" />
                  <stop offset="100%" stopColor={upGlow} stopOpacity="0"    />
                </linearGradient>
                <filter id="aaoi-mini-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="1.2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* faint trend baseline */}
              <rect x="0" y="0" width={W} height={H} fill="url(#aaoi-mini-bg)" />

              {candles.map((c, i) => {
                const xCenter = PAD_X + i * slotW + slotW / 2;
                const isGreen = c.c >= c.o;
                const color = isGreen ? upColor : downColor;
                const wickTop = yPx(c.h);
                const wickBot = yPx(c.l);
                const bodyTop = yPx(Math.max(c.o, c.c));
                const bodyBot = yPx(Math.min(c.o, c.c));
                const bodyH = Math.max(1, bodyBot - bodyTop);
                const isLatest = i === candles.length - 1;
                // staggered slide-in: each candle delayed slightly
                const delay = `${i * 28}ms`;

                return (
                  <g key={`${c.t}-${i}`}
                    style={{
                      animation: `candle-rise 600ms cubic-bezier(0.22,1,0.36,1) ${delay} both`,
                      transformOrigin: `${xCenter}px ${H - PAD_Y}px`,
                    }}>
                    {/* wick */}
                    <line x1={xCenter} x2={xCenter} y1={wickTop} y2={wickBot}
                      stroke={color} strokeWidth="1" strokeLinecap="round"
                      opacity={isLatest ? 1 : 0.85} />
                    {/* body */}
                    <rect x={xCenter - candleW / 2} y={bodyTop}
                      width={candleW} height={bodyH}
                      fill={color} rx="0.6"
                      opacity={isLatest ? 1 : 0.9}
                      filter={isLatest ? "url(#aaoi-mini-glow)" : undefined}>
                      {isLatest && (
                        <animate
                          attributeName="opacity"
                          values="0.55;1;0.55"
                          dur="1.6s"
                          repeatCount="indefinite" />
                      )}
                    </rect>
                  </g>
                );
              })}
            </svg>
          ) : (
            <div className="h-[90px] flex items-center justify-center text-[10px] text-violet-400/40">
              loading…
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[8px] tracking-[0.2em] text-violet-500/40 uppercase pb-2">
          Yahoo · 1d × {VISIBLE}
        </p>
      </div>

      {/* Re-open chip when closed */}
      {!open && (
        <button onClick={() => setOpen(true)}
          aria-label="Show AAOI ticker"
          className="fixed bottom-6 left-6 z-50 px-3 py-2 rounded-full
            glass shadow-lg cursor-pointer flex items-center gap-2
            hover:scale-[1.04] active:scale-95 transition-transform"
          style={{ border: "1px solid rgba(74,222,128,0.3)" }}>
          <BarChart3 size={12} className="text-emerald-400" />
          <span className="text-[10px] font-mono tracking-widest text-violet-200">
            AAOI {data ? `$${data.last?.toFixed(2)}` : ""}
          </span>
        </button>
      )}
    </>
  );
}
