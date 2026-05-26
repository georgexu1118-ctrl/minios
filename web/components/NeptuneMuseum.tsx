"use client";
import { useEffect, useRef, useState } from "react";
// useRef kept for containerRef (resize observer)

// ---------------------------------------------------------------------------
// Neptune + Interstellar Galaxies — deep-space cinematic scene
// Interactive: mouse tracking drives 3D tilt + galaxy parallax (Browserbase-style)
// ---------------------------------------------------------------------------

function NeptuneBody({ size }: { size: number }) {
  const blur = (f: number) => `${Math.max(1, size * f)}px`;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Painting grain filter */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <filter id="neptune-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
            <feBlend in="SourceGraphic" mode="overlay" result="blend" />
            <feComposite in="blend" in2="SourceGraphic" operator="in" />
          </filter>
        </defs>
      </svg>

      <div className="absolute inset-0 rounded-full overflow-hidden" style={{
        background:
          "radial-gradient(circle at 36% 34%, #3b82f6 0%, #2563eb 8%, #1d4ed8 18%, #1e3a8a 34%, #172554 54%, #0f172a 74%, #060c18 90%, #000 100%)",
        boxShadow:
          `0 0 ${size * 0.6}px rgba(37,99,235,0.38),` +
          `0 0 ${size * 1.2}px rgba(29,78,216,0.16),` +
          `inset -${size * 0.22}px -${size * 0.12}px ${size * 0.4}px rgba(0,0,0,0.82),` +
          `inset ${size * 0.04}px ${size * 0.04}px ${size * 0.22}px rgba(96,165,250,0.09)`,
      }}>
        {/* Painting brushstroke bands — wide, organic */}
        <div className="absolute" style={{
          top: "18%", left: "-8%", width: "116%", height: "22%",
          background: "linear-gradient(182deg, transparent 0%, rgba(59,130,246,0.28) 35%, rgba(96,165,250,0.18) 60%, rgba(147,197,253,0.08) 80%, transparent 100%)",
          filter: `blur(${blur(0.045)})`,
          transform: "rotate(-1.5deg)",
        }} />
        <div className="absolute" style={{
          top: "44%", left: "-8%", width: "116%", height: "18%",
          background: "linear-gradient(178deg, transparent 0%, rgba(37,99,235,0.22) 40%, rgba(59,130,246,0.13) 68%, transparent 100%)",
          filter: `blur(${blur(0.05)})`,
          transform: "rotate(1deg)",
        }} />
        <div className="absolute" style={{
          top: "66%", left: "-8%", width: "116%", height: "12%",
          background: "linear-gradient(181deg, transparent 0%, rgba(29,78,216,0.16) 45%, rgba(37,99,235,0.09) 72%, transparent 100%)",
          filter: `blur(${blur(0.04)})`,
        }} />

        {/* Polar brightening — painterly wash */}
        <div className="absolute" style={{
          top: "-4%", left: "8%", width: "84%", height: "34%",
          background: "radial-gradient(ellipse at 50% 18%, rgba(147,197,253,0.20) 0%, rgba(96,165,250,0.08) 50%, transparent 75%)",
          filter: `blur(${blur(0.06)})`,
        }} />
        <div className="absolute" style={{
          bottom: "-4%", left: "12%", width: "76%", height: "28%",
          background: "radial-gradient(ellipse at 50% 82%, rgba(96,165,250,0.14) 0%, transparent 70%)",
          filter: `blur(${blur(0.05)})`,
        }} />

        {/* Great Dark Spot — deep void */}
        <div className="absolute" style={{
          top: "34%", left: "20%", width: "30%", height: "18%",
          background: "radial-gradient(ellipse at 45% 50%, rgba(3,7,24,0.95) 0%, rgba(8,14,42,0.80) 48%, transparent 80%)",
          filter: `blur(${blur(0.024)})`,
          transform: "rotate(-8deg)",
        }} />
        {/* Dark Spot inner swirl */}
        <div className="absolute" style={{
          top: "37%", left: "24%", width: "20%", height: "12%",
          background: "radial-gradient(ellipse at 42% 48%, rgba(15,23,60,0.88) 0%, transparent 75%)",
          filter: `blur(${blur(0.016)})`,
          transform: "rotate(-10deg)",
        }} />

        {/* Scooter cloud — bright brushstroke */}
        <div className="absolute" style={{
          top: "43%", left: "47%", width: "16%", height: "7%",
          background: "radial-gradient(ellipse, rgba(219,234,254,0.65) 0%, rgba(186,230,253,0.32) 50%, transparent 80%)",
          filter: `blur(${blur(0.016)})`,
        }} />

        {/* Cirrus streaks — painterly wisps */}
        <div className="absolute" style={{
          top: "21%", left: "28%", width: "36%", height: "4%",
          background: "linear-gradient(90deg, transparent, rgba(186,230,253,0.40) 35%, rgba(219,234,254,0.28) 58%, transparent)",
          filter: `blur(${blur(0.014)})`,
          transform: "rotate(-2.5deg)",
        }} />
        <div className="absolute" style={{
          top: "57%", left: "12%", width: "28%", height: "3%",
          background: "linear-gradient(92deg, transparent, rgba(147,197,253,0.30) 40%, rgba(186,230,253,0.18) 65%, transparent)",
          filter: `blur(${blur(0.014)})`,
          transform: "rotate(1.5deg)",
        }} />
        <div className="absolute" style={{
          top: "30%", left: "55%", width: "24%", height: "3%",
          background: "linear-gradient(88deg, transparent, rgba(186,230,253,0.25) 45%, transparent)",
          filter: `blur(${blur(0.012)})`,
          transform: "rotate(-1deg)",
        }} />

        {/* Atmospheric banding — oil-painting texture */}
        <div className="absolute inset-0" style={{
          backgroundImage:
            "repeating-linear-gradient(177deg, transparent 0%, rgba(30,58,138,0.22) 2.5%, transparent 5.5%, rgba(59,130,246,0.10) 8.5%, transparent 12%)",
          mixBlendMode: "overlay",
        }} />

        {/* Chromatic aberration — blue limb glow (left) */}
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at 8% 50%, rgba(96,165,250,0.18) 0%, transparent 38%)",
          mixBlendMode: "screen",
        }} />

        {/* Terminator shadow */}
        <div className="absolute inset-0" style={{
          background: "radial-gradient(circle at 68% 60%, transparent 22%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.82) 88%)",
        }} />

        {/* Painting grain overlay */}
        <div className="absolute inset-0 rounded-full" style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E\")",
          backgroundSize: "160px 160px",
          opacity: 0.55,
          mixBlendMode: "overlay",
        }} />

        {/* Primary specular highlight */}
        <div className="absolute rounded-full" style={{
          top: `${size * 0.07}px`, left: `${size * 0.20}px`,
          width: size * 0.24, height: size * 0.15,
          background: "radial-gradient(circle, rgba(219,234,254,0.52) 0%, rgba(186,230,253,0.22) 45%, transparent 75%)",
          filter: `blur(${blur(0.012)})`,
        }} />
        {/* Secondary soft catch-light */}
        <div className="absolute rounded-full" style={{
          top: `${size * 0.14}px`, left: `${size * 0.28}px`,
          width: size * 0.10, height: size * 0.06,
          background: "radial-gradient(circle, rgba(255,255,255,0.35) 0%, transparent 70%)",
          filter: `blur(${blur(0.006)})`,
        }} />
      </div>
    </div>
  );
}

interface GalaxyProps {
  size: number;
  coreColor: string;
  armColor: string;
  outerColor: string;
  tiltDeg: number;
  armRotate: number;
  driftDuration: number;
  style?: React.CSSProperties;
  label?: string;
  labelColor?: string;
}

function Galaxy({ size, coreColor, armColor, outerColor, tiltDeg, armRotate, driftDuration, style, label, labelColor }: GalaxyProps) {
  return (
    <div className="absolute pointer-events-none" style={{ width: size, height: size, ...style }}>
      <div style={{ width: size, height: size, position: "relative", animation: `nebula-drift ${driftDuration}s ease-in-out infinite` }}>
        <div style={{
          position: "absolute", inset: `-${size * 0.35}px`,
          background: `radial-gradient(ellipse at 50% 50%, ${outerColor}14 0%, ${outerColor}06 40%, transparent 68%)`,
          filter: `blur(${size * 0.18}px)`, transform: `rotate(${tiltDeg * 0.3}deg)`,
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse at 50% 50%, ${coreColor}cc 0%, ${armColor}88 18%, ${outerColor}55 40%, ${outerColor}22 62%, transparent 80%)`,
          borderRadius: "50%", transform: `rotate(${tiltDeg}deg) scaleY(0.28)`,
          filter: `blur(${Math.max(1, size * 0.014)}px)`,
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse at 62% 46%, ${armColor}70 0%, ${armColor}38 28%, transparent 60%)`,
          borderRadius: "50%", transform: `rotate(${tiltDeg + armRotate}deg) scaleY(0.18) scaleX(1.5)`,
          filter: `blur(${Math.max(1, size * 0.016)}px)`,
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse at 38% 54%, ${armColor}65 0%, ${armColor}32 28%, transparent 58%)`,
          borderRadius: "50%", transform: `rotate(${tiltDeg + armRotate + 180}deg) scaleY(0.18) scaleX(1.5)`,
          filter: `blur(${Math.max(1, size * 0.016)}px)`,
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse at 68% 38%, ${armColor}40 0%, ${outerColor}20 35%, transparent 62%)`,
          borderRadius: "50%", transform: `rotate(${tiltDeg + armRotate + 70}deg) scaleY(0.14) scaleX(1.7)`,
          filter: `blur(${Math.max(1, size * 0.02)}px)`,
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse at 50% 50%, transparent 0%, transparent 14%, rgba(0,0,0,0.30) 22%, transparent 35%)`,
          borderRadius: "50%", transform: `rotate(${tiltDeg + 5}deg) scaleY(0.10)`,
          filter: `blur(${Math.max(1, size * 0.008)}px)`,
        }} />
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: size * 0.10, height: size * 0.10, borderRadius: "50%",
          background: `radial-gradient(circle, #fff 0%, ${coreColor} 35%, transparent 78%)`,
          boxShadow: `0 0 ${size * 0.08}px ${coreColor}, 0 0 ${size * 0.18}px ${armColor}66`,
          filter: `blur(${Math.max(0.5, size * 0.007)}px)`,
        }} />
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: size * 0.26, height: size * 0.26, borderRadius: "50%",
          background: `radial-gradient(circle, ${coreColor}44 0%, transparent 70%)`,
          filter: `blur(${Math.max(1, size * 0.018)}px)`,
        }} />
      </div>
      {label && (
        <p style={{
          position: "absolute", bottom: `-${size * 0.22}px`, left: "50%",
          transform: "translateX(-50%)", fontSize: "9px", fontFamily: "monospace",
          letterSpacing: "0.35em", textTransform: "uppercase",
          color: labelColor ?? "rgba(147,197,253,0.35)", whiteSpace: "nowrap",
        }}>{label}</p>
      )}
    </div>
  );
}

function CosmicDust() {
  const dots = Array.from({ length: 55 }, (_, i) => ({
    id: i,
    left: (i * 37.3 + 11) % 100,
    top: (i * 59.7 + 23) % 100,
    size: (i % 6) * 0.28 + 0.4,
    delay: (i % 9) * 0.9,
    duration: 4 + (i % 7),
    blue: i % 3 !== 0,
  }));
  return (
    <div className="absolute inset-0 pointer-events-none">
      {dots.map(d => (
        <div key={d.id} className="absolute rounded-full" style={{
          left: `${d.left}%`, top: `${d.top}%`,
          width: d.size, height: d.size,
          background: d.blue ? "rgba(147,197,253,0.85)" : "rgba(255,255,255,0.70)",
          boxShadow: d.blue ? "0 0 4px rgba(59,130,246,0.5)" : "0 0 3px rgba(255,255,255,0.3)",
          animation: `dust-twinkle ${d.duration}s ease-in-out ${d.delay}s infinite`,
        }} />
      ))}
    </div>
  );
}

export default function NeptuneMuseum() {
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      if (w < 640) setScale(0.45);
      else if (w < 900) setScale(0.65);
      else if (w < 1200) setScale(0.82);
      else if (w < 1600) setScale(0.96);
      else setScale(1.1);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const neptuneSize = 260 * scale;

  return (
    <section
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={{ minHeight: "100vh", background: "#010813" }}
    >
      {/* Deep blue cosmos gradient */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background:
          "radial-gradient(ellipse at 20% 15%, rgba(59,130,246,0.08) 0%, transparent 40%)," +
          "radial-gradient(ellipse at 80% 80%, rgba(29,78,216,0.07) 0%, transparent 45%)," +
          "radial-gradient(ellipse at 65% 20%, rgba(139,92,246,0.05) 0%, transparent 35%)," +
          "radial-gradient(ellipse at 50% 50%, rgba(10,16,40,1) 0%, #010813 68%)",
      }} />

      {/* Distant sun */}
      <div className="absolute pointer-events-none" style={{
        top: "10%", left: "16%", width: 3, height: 3, borderRadius: "50%",
        background: "#fef9e7",
        boxShadow: "0 0 10px rgba(254,249,231,0.9), 0 0 30px rgba(254,249,231,0.35), 0 0 65px rgba(254,249,231,0.12)",
      }} />

      <CosmicDust />

      {/* Letterbox */}
      <div className="absolute top-0 inset-x-0 pointer-events-none z-20"
        style={{ height: "60px", background: "linear-gradient(to bottom, rgba(1,8,19,0.97), transparent)" }} />
      <div className="absolute bottom-0 inset-x-0 pointer-events-none z-20"
        style={{ height: "100px", background: "linear-gradient(to top, rgba(1,8,19,0.97), transparent)" }} />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ boxShadow: "inset 0 0 280px 70px rgba(1,8,19,0.90)" }} />

      {/* Title */}
      <div className="relative z-10 pt-20 md:pt-24 text-center px-4">
        <p className="text-[9px] md:text-[10px] tracking-[0.6em] text-blue-400/35 uppercase mb-4 animate-fade-in">
          Deep Space Observatory
        </p>
        <h2 className="text-2xl md:text-4xl font-extralight text-white/90 tracking-wide animate-fade-in-delay-1"
          style={{ letterSpacing: "0.04em" }}>
          Neptune &amp; the{" "}
          <span style={{
            background: "linear-gradient(135deg, #818cf8 0%, #a78bfa 40%, #c084fc 80%, #e879f9 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text", fontStyle: "italic", fontWeight: 300,
          }}>Interstellar Deep</span>
        </h2>
        <p className="text-blue-300/28 text-[11px] md:text-xs mt-3 max-w-sm mx-auto animate-fade-in-delay-2 font-light tracking-[0.15em]">
          At the edge of the solar system, the galaxy opens.
        </p>
      </div>

      {/* Stage */}
      <div
        className="relative w-full flex justify-center items-center"
        style={{
          height: `${720 * scale + 120}px`,
          animation: "stage-dolly-in 6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        {/* ── GALAXIES ─────────────────────────────────────────────── */}
        <Galaxy
          size={220 * scale}
          coreColor="#fbbf24" armColor="#f59e0b" outerColor="#d97706"
          tiltDeg={-38} armRotate={52} driftDuration={55}
          label="NGC 1300" labelColor="rgba(251,191,36,0.30)"
          style={{
            left: `calc(50% - ${neptuneSize * 1.55 + 220 * scale * 0.5}px)`,
            top: "50%",
            transform: "translateY(-42%)",
          }}
        />
        <Galaxy
          size={170 * scale}
          coreColor="#a78bfa" armColor="#7c3aed" outerColor="#6d28d9"
          tiltDeg={22} armRotate={-35} driftDuration={45}
          label="M 74" labelColor="rgba(167,139,250,0.30)"
          style={{
            left: `calc(50% + ${neptuneSize * 1.45 + 170 * scale * 0.2}px)`,
            top: "50%",
            transform: "translateY(-55%)",
          }}
        />
        <Galaxy
          size={100 * scale}
          coreColor="#e0f2fe" armColor="#7dd3fc" outerColor="#38bdf8"
          tiltDeg={5} armRotate={90} driftDuration={70}
          label="NGC 4565" labelColor="rgba(125,211,252,0.25)"
          style={{
            left: `calc(50% + ${neptuneSize * 0.3}px)`,
            top: `${18 * scale}%`,
            transform: "translateY(0%)",
          }}
        />

        {/* ── NEPTUNE ──────────────────────────────────────────────── */}

        {/* Outer diffuse blue glow */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{
          width: neptuneSize * 4.8, height: neptuneSize * 4.8,
          background: "radial-gradient(circle, rgba(29,78,216,0.09) 0%, rgba(37,99,235,0.04) 32%, transparent 60%)",
          filter: "blur(80px)",
        }} />

        {/* Inner breathing halo */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{
          width: neptuneSize * 2.2, height: neptuneSize * 2.2,
          background: "radial-gradient(circle, rgba(37,99,235,0.16) 0%, rgba(29,78,216,0.07) 40%, transparent 65%)",
          filter: "blur(38px)",
          animation: "halo-breathe 9s ease-in-out infinite",
        }} />

        {/* Neptune planet */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
          style={{ animation: "pluto-float 16s ease-in-out infinite" }}
        >
          <NeptuneBody size={neptuneSize} />
        </div>

        {/* Neptune label */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 pointer-events-none z-10"
          style={{ marginTop: neptuneSize * 0.62 + 14 }}>
          <p className="text-center text-[10px] font-mono tracking-[0.5em] text-blue-400/28 uppercase">
            Neptune
          </p>
        </div>
      </div>
    </section>
  );
}
