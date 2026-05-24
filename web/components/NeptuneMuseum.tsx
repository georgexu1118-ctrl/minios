"use client";
import { useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Neptune + Interstellar Galaxies — deep-space cinematic scene
// ---------------------------------------------------------------------------

// Realistic Neptune body.
function NeptuneBody({ size }: { size: number }) {
  const blur = (f: number) => `${Math.max(1, size * f)}px`;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full overflow-hidden" style={{
        background:
          "radial-gradient(circle at 36% 34%, #2563eb 0%, #1d4ed8 12%, #1e3a8a 28%, #172554 50%, #0f172a 72%, #060c18 90%, #000 100%)",
        boxShadow:
          `0 0 ${size * 0.55}px rgba(37,99,235,0.32),` +
          `0 0 ${size * 1.1}px rgba(29,78,216,0.14),` +
          `inset -${size * 0.22}px -${size * 0.12}px ${size * 0.38}px rgba(0,0,0,0.80),` +
          `inset ${size * 0.04}px ${size * 0.04}px ${size * 0.20}px rgba(96,165,250,0.07)`,
      }}>
        {/* Equatorial belt */}
        <div className="absolute" style={{
          top: "28%", left: "-5%", width: "110%", height: "18%",
          background: "linear-gradient(180deg, transparent 0%, rgba(59,130,246,0.22) 40%, rgba(96,165,250,0.14) 65%, transparent 100%)",
          filter: `blur(${blur(0.035)})`,
        }} />
        {/* Mid-latitude band */}
        <div className="absolute" style={{
          top: "52%", left: "-5%", width: "110%", height: "14%",
          background: "linear-gradient(180deg, transparent 0%, rgba(37,99,235,0.18) 45%, rgba(59,130,246,0.10) 70%, transparent 100%)",
          filter: `blur(${blur(0.04)})`,
        }} />
        {/* Polar brightening */}
        <div className="absolute" style={{
          top: "0%", left: "10%", width: "80%", height: "28%",
          background: "radial-gradient(ellipse at 50% 20%, rgba(96,165,250,0.16) 0%, transparent 70%)",
          filter: `blur(${blur(0.05)})`,
        }} />
        {/* Great Dark Spot */}
        <div className="absolute" style={{
          top: "35%", left: "22%", width: "28%", height: "16%",
          background: "radial-gradient(ellipse at 45% 50%, rgba(5,10,30,0.92) 0%, rgba(10,18,50,0.75) 45%, transparent 80%)",
          filter: `blur(${blur(0.022)})`,
          transform: "rotate(-8deg)",
        }} />
        {/* Scooter cloud */}
        <div className="absolute" style={{
          top: "44%", left: "48%", width: "14%", height: "6%",
          background: "radial-gradient(ellipse, rgba(186,230,253,0.55) 0%, rgba(147,197,253,0.25) 55%, transparent 80%)",
          filter: `blur(${blur(0.018)})`,
        }} />
        {/* Cirrus streaks */}
        <div className="absolute" style={{
          top: "22%", left: "30%", width: "32%", height: "4%",
          background: "linear-gradient(90deg, transparent, rgba(186,230,253,0.35) 40%, rgba(219,234,254,0.22) 60%, transparent)",
          filter: `blur(${blur(0.015)})`,
          transform: "rotate(-3deg)",
        }} />
        {/* Surface banding */}
        <div className="absolute inset-0" style={{
          backgroundImage:
            "repeating-linear-gradient(178deg, transparent 0%, rgba(30,58,138,0.20) 3%, transparent 6%, rgba(59,130,246,0.08) 9%, transparent 13%)",
          mixBlendMode: "overlay",
        }} />
        {/* Terminator */}
        <div className="absolute inset-0" style={{
          background: "radial-gradient(circle at 68% 58%, transparent 26%, rgba(0,0,0,0.38) 52%, rgba(0,0,0,0.80) 88%)",
        }} />
        {/* Specular */}
        <div className="absolute rounded-full" style={{
          top: `${size * 0.08}px`, left: `${size * 0.22}px`,
          width: size * 0.20, height: size * 0.13,
          background: "radial-gradient(circle, rgba(186,230,253,0.38) 0%, rgba(147,197,253,0.12) 52%, transparent 78%)",
          filter: `blur(${blur(0.011)})`,
        }} />
      </div>
    </div>
  );
}

// CSS spiral galaxy.
interface GalaxyProps {
  size: number;
  coreColor: string;
  armColor: string;
  outerColor: string;
  tiltDeg: number;       // disc tilt (makes it look like an inclined spiral)
  armRotate: number;     // angle offset for spiral arms
  driftDuration: number; // slow drift animation speed
  style?: React.CSSProperties;
  label?: string;
  labelColor?: string;
}

function Galaxy({ size, coreColor, armColor, outerColor, tiltDeg, armRotate, driftDuration, style, label, labelColor }: GalaxyProps) {
  return (
    <div className="absolute pointer-events-none" style={{ width: size, height: size, ...style }}>
      <div style={{ width: size, height: size, position: "relative", animation: `nebula-drift ${driftDuration}s ease-in-out infinite` }}>

        {/* Outer diffuse cloud */}
        <div style={{
          position: "absolute",
          inset: `-${size * 0.35}px`,
          background: `radial-gradient(ellipse at 50% 50%, ${outerColor}14 0%, ${outerColor}06 40%, transparent 68%)`,
          filter: `blur(${size * 0.18}px)`,
          transform: `rotate(${tiltDeg * 0.3}deg)`,
        }} />

        {/* Main disc — flattened ellipse */}
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse at 50% 50%, ${coreColor}cc 0%, ${armColor}88 18%, ${outerColor}55 40%, ${outerColor}22 62%, transparent 80%)`,
          borderRadius: "50%",
          transform: `rotate(${tiltDeg}deg) scaleY(0.28)`,
          filter: `blur(${Math.max(1, size * 0.014)}px)`,
        }} />

        {/* Spiral arm 1 */}
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse at 62% 46%, ${armColor}70 0%, ${armColor}38 28%, transparent 60%)`,
          borderRadius: "50%",
          transform: `rotate(${tiltDeg + armRotate}deg) scaleY(0.18) scaleX(1.5)`,
          filter: `blur(${Math.max(1, size * 0.016)}px)`,
        }} />

        {/* Spiral arm 2 (opposite) */}
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse at 38% 54%, ${armColor}65 0%, ${armColor}32 28%, transparent 58%)`,
          borderRadius: "50%",
          transform: `rotate(${tiltDeg + armRotate + 180}deg) scaleY(0.18) scaleX(1.5)`,
          filter: `blur(${Math.max(1, size * 0.016)}px)`,
        }} />

        {/* Spiral arm 3 — fainter, offset */}
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse at 68% 38%, ${armColor}40 0%, ${outerColor}20 35%, transparent 62%)`,
          borderRadius: "50%",
          transform: `rotate(${tiltDeg + armRotate + 70}deg) scaleY(0.14) scaleX(1.7)`,
          filter: `blur(${Math.max(1, size * 0.02)}px)`,
        }} />

        {/* Dust lane overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse at 50% 50%, transparent 0%, transparent 14%, rgba(0,0,0,0.30) 22%, transparent 35%)`,
          borderRadius: "50%",
          transform: `rotate(${tiltDeg + 5}deg) scaleY(0.10)`,
          filter: `blur(${Math.max(1, size * 0.008)}px)`,
        }} />

        {/* Bright galactic core */}
        <div style={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: size * 0.10,
          height: size * 0.10,
          borderRadius: "50%",
          background: `radial-gradient(circle, #fff 0%, ${coreColor} 35%, transparent 78%)`,
          boxShadow: `0 0 ${size * 0.08}px ${coreColor}, 0 0 ${size * 0.18}px ${armColor}66`,
          filter: `blur(${Math.max(0.5, size * 0.007)}px)`,
        }} />

        {/* Core secondary glow */}
        <div style={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: size * 0.26,
          height: size * 0.26,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${coreColor}44 0%, transparent 70%)`,
          filter: `blur(${Math.max(1, size * 0.018)}px)`,
        }} />
      </div>

      {/* Faint label */}
      {label && (
        <p style={{
          position: "absolute",
          bottom: `-${size * 0.22}px`,
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: "9px",
          fontFamily: "monospace",
          letterSpacing: "0.35em",
          textTransform: "uppercase",
          color: labelColor ?? "rgba(147,197,253,0.35)",
          whiteSpace: "nowrap",
        }}>
          {label}
        </p>
      )}
    </div>
  );
}

function CosmicDust() {
  const dots = Array.from({ length: 55 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: Math.random() * 1.8 + 0.3,
    delay: Math.random() * 8,
    duration: 4 + Math.random() * 7,
    blue: Math.random() > 0.55,
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
      <div className="absolute inset-0" style={{
        background:
          "radial-gradient(ellipse at 20% 15%, rgba(59,130,246,0.08) 0%, transparent 40%)," +
          "radial-gradient(ellipse at 80% 80%, rgba(29,78,216,0.07) 0%, transparent 45%)," +
          "radial-gradient(ellipse at 65% 20%, rgba(139,92,246,0.05) 0%, transparent 35%)," +
          "radial-gradient(ellipse at 50% 50%, rgba(10,16,40,1) 0%, #010813 68%)",
      }} />

      {/* Distant sun */}
      <div className="absolute pointer-events-none" style={{
        top: "10%", left: "16%",
        width: 3, height: 3, borderRadius: "50%",
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
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontStyle: "italic",
            fontWeight: 300,
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

        {/* Left galaxy — barred spiral, warm amber/gold (NGC 1300-ish) */}
        <Galaxy
          size={220 * scale}
          coreColor="#fbbf24"
          armColor="#f59e0b"
          outerColor="#d97706"
          tiltDeg={-38}
          armRotate={52}
          driftDuration={55}
          label="NGC 1300"
          labelColor="rgba(251,191,36,0.30)"
          style={{
            left: `calc(50% - ${neptuneSize * 1.55 + 220 * scale * 0.5}px)`,
            top: "50%",
            transform: "translateY(-42%)",
          }}
        />

        {/* Right galaxy — face-on spiral, cool violet/blue (M74-ish) */}
        <Galaxy
          size={170 * scale}
          coreColor="#a78bfa"
          armColor="#7c3aed"
          outerColor="#6d28d9"
          tiltDeg={22}
          armRotate={-35}
          driftDuration={45}
          label="M 74"
          labelColor="rgba(167,139,250,0.30)"
          style={{
            left: `calc(50% + ${neptuneSize * 1.45 + 170 * scale * 0.2}px)`,
            top: "50%",
            transform: "translateY(-55%)",
          }}
        />

        {/* Background distant galaxy — edge-on sliver, blue-white */}
        <Galaxy
          size={100 * scale}
          coreColor="#e0f2fe"
          armColor="#7dd3fc"
          outerColor="#38bdf8"
          tiltDeg={5}
          armRotate={90}
          driftDuration={70}
          label="NGC 4565"
          labelColor="rgba(125,211,252,0.25)"
          style={{
            left: `calc(50% + ${neptuneSize * 0.3}px)`,
            top: `${18 * scale}%`,
            transform: "translateY(0%)",
          }}
        />

        {/* ── NEPTUNE ──────────────────────────────────────────────── */}

        {/* Outer diffuse blue glow */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{
          width: neptuneSize * 4.8,
          height: neptuneSize * 4.8,
          background: "radial-gradient(circle, rgba(29,78,216,0.07) 0%, rgba(37,99,235,0.03) 32%, transparent 60%)",
          filter: "blur(80px)",
        }} />

        {/* Inner breathing halo */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{
          width: neptuneSize * 2.2,
          height: neptuneSize * 2.2,
          background: "radial-gradient(circle, rgba(37,99,235,0.14) 0%, rgba(29,78,216,0.06) 40%, transparent 65%)",
          filter: "blur(38px)",
          animation: "halo-breathe 9s ease-in-out infinite",
        }} />

        {/* Neptune planet */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
          style={{ animation: "pluto-float 16s ease-in-out infinite" }}>
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
