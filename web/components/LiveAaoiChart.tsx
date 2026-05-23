"use client";
import { useEffect, useState } from "react";
import { TrendingUp, Activity, RefreshCw } from "lucide-react";

interface ChartPoint { t: number; c: number; }
interface ChartData {
  symbol: string;
  currency: string;
  last: number;
  prevClose: number;
  change: number;
  changePct: number;
  points: ChartPoint[];
}

const RANGES = [
  { id: "5d",  label: "5D",  interval: "30m" },
  { id: "1mo", label: "1M",  interval: "1d" },
  { id: "6mo", label: "6M",  interval: "1d" },
  { id: "ytd", label: "YTD", interval: "1d" },
  { id: "1y",  label: "1Y",  interval: "1d" },
  { id: "5y",  label: "5Y",  interval: "1wk" },
];

export default function LiveAaoiChart() {
  const [data, setData] = useState<ChartData | null>(null);
  const [range, setRange] = useState("ytd");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const fetchChart = async (r: string) => {
    setLoading(true); setErr(null);
    const interval = RANGES.find(x => x.id === r)?.interval ?? "1d";
    try {
      const res = await fetch(`/api/chart?symbol=AAOI&range=${r}&interval=${interval}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d: ChartData = await res.json();
      if (!d.points?.length) throw new Error("no points");
      setData(d);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "fetch failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchChart(range); }, [range]);

  const isUp = (data?.change ?? 0) >= 0;
  const lineColor = isUp ? "#4ade80" : "#f87171";
  const fillTop   = isUp ? "rgba(74,222,128,0.35)" : "rgba(248,113,113,0.35)";
  const fillBot   = isUp ? "rgba(74,222,128,0.0)"  : "rgba(248,113,113,0.0)";

  // Build SVG path
  const W = 800, H = 280, PAD_L = 50, PAD_R = 10, PAD_T = 20, PAD_B = 30;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const pts = data?.points ?? [];
  let path = "", areaPath = "", minY = 0, maxY = 0;
  if (pts.length > 1) {
    const ys = pts.map(p => p.c);
    minY = Math.min(...ys);
    maxY = Math.max(...ys);
    const rangeY = maxY - minY || 1;
    const xs = pts.map((_, i) => PAD_L + (i / (pts.length - 1)) * innerW);
    const ysPx = pts.map(p => PAD_T + innerH - ((p.c - minY) / rangeY) * innerH);
    path = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ysPx[i].toFixed(1)}`).join(" ");
    areaPath = `${path} L${xs[xs.length-1].toFixed(1)},${PAD_T + innerH} L${xs[0].toFixed(1)},${PAD_T + innerH} Z`;
  }

  // Y-axis ticks
  const yTicks: number[] = [];
  if (pts.length > 1) {
    for (let i = 0; i <= 4; i++) yTicks.push(minY + ((maxY - minY) * i) / 4);
  }

  // X-axis labels (start, mid, end)
  const xLabels: { x: number; label: string }[] = [];
  if (pts.length > 1) {
    const fmt = (ms: number) => {
      const d = new Date(ms);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };
    [0, Math.floor(pts.length / 2), pts.length - 1].forEach(i => {
      xLabels.push({ x: PAD_L + (i / (pts.length - 1)) * innerW, label: fmt(pts[i].t) });
    });
  }

  return (
    <div className="glass rounded-3xl overflow-hidden p-6 md:p-8"
      style={{ border: "1px solid rgba(34,211,238,0.18)" }}>

      {/* Header */}
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono tracking-widest uppercase"
              style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.25)", color: "#22d3ee" }}>
              Live · Yahoo Finance
            </span>
            <Activity size={11} className="text-emerald-400 animate-pulse" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-violet-100">
            AAOI <span className="text-violet-400/60 text-sm font-normal">— Applied Optoelectronics</span>
          </h3>
        </div>

        {data && (
          <div className="text-right">
            <p className="text-2xl md:text-3xl font-bold text-violet-50">
              ${data.last?.toFixed(2)}
              <span className="text-xs ml-2 text-violet-400/50 font-normal">{data.currency}</span>
            </p>
            <p className="text-sm font-semibold flex items-center justify-end gap-1"
              style={{ color: isUp ? "#4ade80" : "#f87171" }}>
              <TrendingUp size={13} style={{ transform: isUp ? "" : "rotate(180deg)" }} />
              {data.change >= 0 ? "+" : ""}{data.change?.toFixed(2)}
              ({data.changePct >= 0 ? "+" : ""}{data.changePct?.toFixed(2)}%)
            </p>
          </div>
        )}
      </div>

      {/* Range tabs */}
      <div className="flex gap-1 mb-4 flex-wrap">
        {RANGES.map(r => (
          <button key={r.id} onClick={() => setRange(r.id)}
            className={`px-3 py-1 rounded-lg text-[11px] font-mono tracking-widest transition-colors cursor-pointer
              ${range === r.id
                ? "bg-violet-700/50 text-violet-100 border border-violet-500/40"
                : "text-violet-400/60 hover:text-violet-300 border border-transparent"}`}>
            {r.label}
          </button>
        ))}
        <button onClick={() => fetchChart(range)} disabled={loading}
          className="ml-auto px-3 py-1 rounded-lg text-violet-400/60 hover:text-violet-300 cursor-pointer disabled:opacity-40"
          aria-label="Refresh">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Chart */}
      <div className="relative w-full" style={{ minHeight: H }}>
        {err && (
          <div className="absolute inset-0 flex items-center justify-center text-violet-400/60 text-sm">
            chart unavailable: {err}
          </div>
        )}
        {!err && pts.length > 1 && (
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="aaoi-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={fillTop} />
                <stop offset="100%" stopColor={fillBot} />
              </linearGradient>
            </defs>

            {/* Y grid + labels */}
            {yTicks.map((v, i) => {
              const y = PAD_T + innerH - ((v - minY) / (maxY - minY || 1)) * innerH;
              return (
                <g key={i}>
                  <line x1={PAD_L} x2={W - PAD_R} y1={y} y2={y}
                    stroke="rgba(124,58,237,0.08)" strokeWidth="1" />
                  <text x={PAD_L - 6} y={y + 4} textAnchor="end"
                    fill="rgba(196,181,253,0.5)" fontSize="10" fontFamily="ui-monospace, monospace">
                    ${v.toFixed(v >= 100 ? 0 : 2)}
                  </text>
                </g>
              );
            })}

            {/* X axis labels */}
            {xLabels.map((l, i) => (
              <text key={i} x={l.x} y={H - 8} textAnchor={i === 0 ? "start" : i === xLabels.length - 1 ? "end" : "middle"}
                fill="rgba(196,181,253,0.5)" fontSize="10" fontFamily="ui-monospace, monospace">
                {l.label}
              </text>
            ))}

            {/* Area + line */}
            <path d={areaPath} fill="url(#aaoi-fill)" />
            <path d={path} fill="none" stroke={lineColor} strokeWidth="2"
              strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        )}
        {!err && pts.length <= 1 && loading && (
          <div className="absolute inset-0 flex items-center justify-center text-violet-400/60 text-sm">
            loading chart…
          </div>
        )}
      </div>

      <p className="text-[10px] text-violet-500/40 mt-3 font-mono tracking-wider">
        Source: query1.finance.yahoo.com · auto-refresh on tab change
      </p>
    </div>
  );
}
