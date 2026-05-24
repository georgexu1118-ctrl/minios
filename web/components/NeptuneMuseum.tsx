"use client";
import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

// ---------------------------------------------------------------------------
// The Neptune System — cinematic, click-to-explore museum
// ---------------------------------------------------------------------------

interface Moon {
  name: string;
  diameter: string;
  discovered: string;
  orbital: string;
  tagline: string;
  description: string;
  mythos: string;
  color: string;
  highlight: string;
  shadow: string;
  size: number;
  orbit: number;
  duration: number;
  startAngle: number;
  tilt: number;
}

const MOONS: Moon[] = [
  {
    name: "Triton",
    diameter: "2,707 km",
    discovered: "1846",
    orbital: "5.9 days (retrograde)",
    tagline: "The one that swims against the current.",
    description:
      "Alone among large moons, Triton orbits backward — a captured Kuiper Belt object doomed to spiral inward. In roughly 3.6 billion years it will cross Neptune's Roche limit and shatter into a ring. Nitrogen geysers erupt from its south pole, painting dark streaks across its cantaloupe terrain.",
    mythos: "Son of Poseidon, herald of the seas, bearing a conch shell that could calm or raise the waves.",
    color: "#c49a72",
    highlight: "#e8d4b4",
    shadow: "#3a2010",
    size: 88,
    orbit: 330,
    duration: 145,
    startAngle: 20,
    tilt: -15,
  },
  {
    name: "Nereid",
    diameter: "340 km",
    discovered: "1949",
    orbital: "360.1 days",
    tagline: "The most eccentric of wanderers.",
    description:
      "Nereid follows one of the most elongated orbits in the solar system — at its farthest it is nearly 10 times farther from Neptune than at its closest. This extreme eccentricity hints it was violently perturbed when Triton was captured billions of years ago.",
    mythos: "The sea-nymphs of Greek mythology, daughters of the Titan Nereus, riding dolphins through the deep.",
    color: "#94a3b8",
    highlight: "#cbd5e1",
    shadow: "#1e293b",
    size: 28,
    orbit: 445,
    duration: 210,
    startAngle: 95,
    tilt: 4,
  },
  {
    name: "Proteus",
    diameter: "420 km",
    discovered: "1989",
    orbital: "1.1 days",
    tagline: "The shapeshifter hidden in the deep.",
    description:
      "Proteus is one of the darkest objects in the solar system — blacker than coal, absorbing almost all light that falls on it. Discovered only when Voyager 2 swept past in 1989, it orbits so close to Neptune that a day on Proteus passes in barely 27 hours.",
    mythos: "The early sea-god of ancient form, able to shift shape to avoid those who sought his prophecy.",
    color: "#374151",
    highlight: "#6b7280",
    shadow: "#111827",
    size: 38,
    orbit: 545,
    duration: 275,
    startAngle: 165,
    tilt: -2,
  },
  {
    name: "Larissa",
    diameter: "194 km",
    discovered: "1989",
    orbital: "0.6 days",
    tagline: "Older than the rings she circles.",
    description:
      "An ancient, cratered body racing so close to Neptune that a single orbit takes less than 14 hours. Larissa is thought to be a remnant of a larger moon shattered by an ancient collision — the debris now forms part of Neptune's faint ring system.",
    mythos: "A sea-nymph and lover of Poseidon, who gave her name to a city on the banks of the river Peneios.",
    color: "#64748b",
    highlight: "#94a3b8",
    shadow: "#0f172a",
    size: 30,
    orbit: 645,
    duration: 345,
    startAngle: 240,
    tilt: 3,
  },
  {
    name: "Galatea",
    diameter: "174 km",
    discovered: "1989",
    orbital: "0.4 days",
    tagline: "Keeper of the arcs.",
    description:
      "Galatea is a shepherd moon — its gravity herds Neptune's faint Leverrier ring into distinct arcs rather than a continuous band. Without Galatea's constant gravitational tending, the arcs would diffuse and dissolve within a century.",
    mythos: "The ivory statue carved by Pygmalion, brought to life by Aphrodite — beauty sculpted from cold stone.",
    color: "#1e3a5f",
    highlight: "#3b82f6",
    shadow: "#0a1628",
    size: 26,
    orbit: 752,
    duration: 430,
    startAngle: 310,
    tilt: -4,
  },
];

// Realistic Neptune body — dark navy gas giant with methane bands and Great Dark Spot.
function NeptuneBody({ size }: { size: number }) {
  const blur = (f: number) => `${Math.max(1, size * f)}px`;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Main sphere */}
      <div
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{
          background:
            "radial-gradient(circle at 36% 34%, #2563eb 0%, #1d4ed8 12%, #1e3a8a 28%, #172554 50%, #0f172a 72%, #060c18 90%, #000 100%)",
          boxShadow:
            `0 0 ${size * 0.55}px rgba(37,99,235,0.32),` +
            `0 0 ${size * 1.1}px rgba(29,78,216,0.14),` +
            `inset -${size * 0.22}px -${size * 0.12}px ${size * 0.38}px rgba(0,0,0,0.80),` +
            `inset ${size * 0.04}px ${size * 0.04}px ${size * 0.20}px rgba(96,165,250,0.07)`,
        }}
      >
        {/* Atmospheric band 1 — bright equatorial belt */}
        <div className="absolute" style={{
          top: "28%", left: "-5%", width: "110%", height: "18%",
          background: "linear-gradient(180deg, transparent 0%, rgba(59,130,246,0.22) 40%, rgba(96,165,250,0.14) 65%, transparent 100%)",
          filter: `blur(${blur(0.035)})`,
        }} />

        {/* Atmospheric band 2 — mid-latitude */}
        <div className="absolute" style={{
          top: "52%", left: "-5%", width: "110%", height: "14%",
          background: "linear-gradient(180deg, transparent 0%, rgba(37,99,235,0.18) 45%, rgba(59,130,246,0.10) 70%, transparent 100%)",
          filter: `blur(${blur(0.04)})`,
        }} />

        {/* Atmospheric band 3 — polar brightening */}
        <div className="absolute" style={{
          top: "0%", left: "10%", width: "80%", height: "28%",
          background: "radial-gradient(ellipse at 50% 20%, rgba(96,165,250,0.16) 0%, transparent 70%)",
          filter: `blur(${blur(0.05)})`,
        }} />

        {/* Great Dark Spot — oval storm feature */}
        <div className="absolute" style={{
          top: "35%", left: "22%",
          width: "28%", height: "16%",
          background: "radial-gradient(ellipse at 45% 50%, rgba(5,10,30,0.92) 0%, rgba(10,18,50,0.75) 45%, transparent 80%)",
          filter: `blur(${blur(0.022)})`,
          transform: "rotate(-8deg)",
        }} />

        {/* Small Scooter cloud — fast white wisp */}
        <div className="absolute" style={{
          top: "44%", left: "48%",
          width: "14%", height: "6%",
          background: "radial-gradient(ellipse, rgba(186,230,253,0.55) 0%, rgba(147,197,253,0.25) 55%, transparent 80%)",
          filter: `blur(${blur(0.018)})`,
        }} />

        {/* High-altitude cirrus streaks */}
        <div className="absolute" style={{
          top: "22%", left: "30%",
          width: "32%", height: "4%",
          background: "linear-gradient(90deg, transparent, rgba(186,230,253,0.35) 40%, rgba(219,234,254,0.22) 60%, transparent)",
          filter: `blur(${blur(0.015)})`,
          transform: "rotate(-3deg)",
        }} />
        <div className="absolute" style={{
          top: "60%", left: "15%",
          width: "24%", height: "3%",
          background: "linear-gradient(90deg, transparent, rgba(147,197,253,0.28) 50%, transparent)",
          filter: `blur(${blur(0.012)})`,
          transform: "rotate(2deg)",
        }} />

        {/* Surface banding texture */}
        <div className="absolute inset-0" style={{
          backgroundImage:
            "repeating-linear-gradient(178deg, transparent 0%, rgba(30,58,138,0.20) 3%, transparent 6%, rgba(59,130,246,0.08) 9%, transparent 13%)",
          mixBlendMode: "overlay",
        }} />


        {/* Terminator shadow */}
        <div className="absolute inset-0" style={{
          background:
            "radial-gradient(circle at 68% 58%, transparent 26%, rgba(0,0,0,0.38) 52%, rgba(0,0,0,0.80) 88%)",
        }} />

        {/* Primary specular highlight */}
        <div className="absolute rounded-full" style={{
          top: `${size * 0.08}px`,
          left: `${size * 0.22}px`,
          width: size * 0.20,
          height: size * 0.13,
          background: "radial-gradient(circle, rgba(186,230,253,0.38) 0%, rgba(147,197,253,0.12) 52%, transparent 78%)",
          filter: `blur(${blur(0.011)})`,
        }} />
      </div>
    </div>
  );
}

// Generic spherical body for moons — fully 3D lit sphere.
function Body({ size, color, highlight, shadow }: {
  size: number; color: string; highlight: string; shadow: string;
}) {
  const b = (f: number) => `${Math.max(0.5, size * f)}px`;
  return (
    <div className="relative" style={{ width: size, height: size }}>

      {/* Drop shadow beneath the sphere */}
      <div className="absolute pointer-events-none" style={{
        bottom: `-${size * 0.06}px`,
        left: `${size * 0.12}px`,
        width: size * 0.76,
        height: size * 0.18,
        background: "radial-gradient(ellipse, rgba(0,0,0,0.55) 0%, transparent 70%)",
        filter: `blur(${b(0.07)})`,
        transform: "scaleY(0.45)",
      }} />

      {/* Main sphere — light from upper-left */}
      <div className="absolute inset-0 rounded-full overflow-hidden" style={{
        background: `radial-gradient(circle at 33% 28%,
          ${highlight} 0%,
          ${highlight} 8%,
          ${color} 26%,
          ${color} 50%,
          ${shadow} 74%,
          #050508 92%,
          #000 100%)`,
      }}>
        {/* Surface micro-texture */}
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(168deg,
            transparent 0%,
            ${shadow}28 4%,
            transparent 8%,
            ${highlight}12 13%,
            transparent 18%)`,
          mixBlendMode: "overlay",
        }} />

        {/* Terminator — gradual dark sweep from right */}
        <div className="absolute inset-0" style={{
          background:
            "radial-gradient(circle at 67% 54%, transparent 22%, rgba(0,0,0,0.42) 48%, rgba(0,0,0,0.88) 82%)",
        }} />

        {/* Rim light — cool blue ambient from the dark limb edge */}
        <div className="absolute inset-0" style={{
          background:
            "radial-gradient(circle at 78% 62%, transparent 54%, rgba(29,78,216,0.22) 72%, rgba(59,130,246,0.14) 85%, transparent 94%)",
        }} />
      </div>

      {/* Soft secondary specular — broad glow */}
      <div className="absolute rounded-full pointer-events-none" style={{
        top: `${size * 0.05}px`,
        left: `${size * 0.14}px`,
        width: size * 0.34,
        height: size * 0.24,
        background: "radial-gradient(circle, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.07) 50%, transparent 76%)",
        filter: `blur(${b(0.020)})`,
      }} />

      {/* Sharp primary specular — bright pinpoint */}
      <div className="absolute rounded-full pointer-events-none" style={{
        top: `${size * 0.09}px`,
        left: `${size * 0.21}px`,
        width: size * 0.18,
        height: size * 0.12,
        background: "radial-gradient(circle, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.55) 28%, rgba(255,255,255,0.12) 60%, transparent 82%)",
        filter: `blur(${b(0.007)})`,
      }} />
    </div>
  );
}

function OrbitingMoon({ moon, dimmed, onClick, scale }: {
  moon: Moon; dimmed: boolean; onClick: () => void; scale: number;
}) {
  const r = moon.orbit * scale;
  const sz = moon.size * scale;

  return (
    <>
      <div
        className="absolute left-1/2 top-1/2 pointer-events-none rounded-full"
        style={{
          width: r * 2, height: r * 2,
          marginLeft: -r, marginTop: -r,
          border: "1px solid rgba(59,130,246,0.08)",
          transform: `rotateX(${74 + moon.tilt}deg)`,
        }}
      />
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: 0, height: 0,
          transform: `rotateX(${74 + moon.tilt}deg) rotate(${moon.startAngle}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        <div style={{ width: 0, height: 0, animation: `orbit-spin ${moon.duration}s linear infinite`, transformStyle: "preserve-3d" }}>
          <button
            type="button"
            onClick={onClick}
            aria-label={`Open ${moon.name}`}
            className="absolute cursor-pointer transition-all duration-500"
            style={{
              left: r, top: 0,
              width: sz, height: sz,
              marginLeft: -sz / 2, marginTop: -sz / 2,
              transform: `rotateX(-${74 + moon.tilt}deg)`,
              transformStyle: "preserve-3d",
              opacity: dimmed ? 0.16 : 1,
              border: "none", background: "transparent", padding: 0,
            }}
          >
            <div className="relative group">
              <Body size={sz} color={moon.color} highlight={moon.highlight} shadow={moon.shadow} />
              <div
                className="absolute -inset-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  border: `1px solid ${moon.highlight}55`,
                  boxShadow: `0 0 16px ${moon.highlight}44`,
                }}
              />
              <span
                className="absolute left-1/2 -translate-x-1/2 -bottom-6 text-[10px] font-mono
                  tracking-[0.3em] uppercase opacity-0 group-hover:opacity-100
                  transition-opacity duration-300 whitespace-nowrap pointer-events-none"
                style={{ color: moon.highlight }}
              >
                {moon.name}
              </span>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}

function CosmicDust() {
  const dots = Array.from({ length: 44 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: Math.random() * 1.6 + 0.4,
    delay: Math.random() * 6,
    duration: 4 + Math.random() * 6,
    blue: Math.random() > 0.6,
  }));
  return (
    <div className="absolute inset-0 pointer-events-none">
      {dots.map(d => (
        <div
          key={d.id}
          className="absolute rounded-full"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: d.size, height: d.size,
            background: d.blue ? "rgba(147,197,253,0.8)" : "rgba(255,255,255,0.65)",
            boxShadow: d.blue ? "0 0 4px rgba(59,130,246,0.5)" : "0 0 3px rgba(255,255,255,0.3)",
            animation: `dust-twinkle ${d.duration}s ease-in-out ${d.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export default function NeptuneMuseum() {
  const [selected, setSelected] = useState<Moon | null>(null);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      if (w < 640) setScale(0.38);
      else if (w < 900) setScale(0.60);
      else if (w < 1200) setScale(0.80);
      else if (w < 1600) setScale(0.95);
      else setScale(1.1);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setSelected(null); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const neptuneSize = 240 * scale;

  return (
    <section
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={{ minHeight: "100vh", background: "#010813" }}
    >
      {/* Deep blue cosmos */}
      <div className="absolute inset-0" style={{
        background:
          "radial-gradient(ellipse at 22% 14%, rgba(59,130,246,0.09) 0%, transparent 42%)," +
          "radial-gradient(ellipse at 78% 75%, rgba(29,78,216,0.07) 0%, transparent 48%)," +
          "radial-gradient(ellipse at 55% 25%, rgba(96,165,250,0.04) 0%, transparent 35%)," +
          "radial-gradient(ellipse at 50% 50%, rgba(10,16,40,1) 0%, #010813 70%)",
      }} />

      {/* Distant sun */}
      <div className="absolute pointer-events-none" style={{
        top: "11%", left: "17%",
        width: 3, height: 3,
        borderRadius: "50%",
        background: "#fef9e7",
        boxShadow: "0 0 10px rgba(254,249,231,0.9), 0 0 32px rgba(254,249,231,0.35), 0 0 70px rgba(254,249,231,0.12)",
      }} />

      <CosmicDust />

      {/* Letterbox */}
      <div className="absolute top-0 inset-x-0 pointer-events-none z-20"
        style={{ height: "60px", background: "linear-gradient(to bottom, rgba(1,8,19,0.97), transparent)" }} />
      <div className="absolute bottom-0 inset-x-0 pointer-events-none z-20"
        style={{ height: "100px", background: "linear-gradient(to top, rgba(1,8,19,0.97), transparent)" }} />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ boxShadow: "inset 0 0 300px 80px rgba(1,8,19,0.92)" }} />

      {/* Title */}
      <div className="relative z-10 pt-20 md:pt-24 text-center px-4">
        <p className="text-[9px] md:text-[10px] tracking-[0.6em] text-blue-400/40 uppercase mb-4 animate-fade-in">
          The Neptune System
        </p>
        <h2 className="text-2xl md:text-4xl font-extralight text-white/90 tracking-wide animate-fade-in-delay-1"
          style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "0.04em" }}>
          A Museum of <span style={{
            background: "linear-gradient(135deg, #60a5fa 0%, #93c5fd 40%, #bfdbfe 80%, #e0f2fe 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontStyle: "italic",
            fontWeight: 300,
          }}>Distant Moons</span>
        </h2>
        <p className="text-blue-300/30 text-[11px] md:text-xs mt-3 max-w-sm mx-auto animate-fade-in-delay-2 font-light tracking-[0.15em]">
          Five worlds dance in the cold blue dark. Click to step closer.
        </p>
      </div>

      {/* Stage */}
      <div
        className="relative w-full flex justify-center items-center"
        style={{
          height: `${1100 * scale + 120}px`,
          perspective: "1800px",
          animation: "stage-dolly-in 6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        {/* Outer diffuse glow */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{
          width: neptuneSize * 5.2,
          height: neptuneSize * 5.2,
          background: "radial-gradient(circle, rgba(29,78,216,0.08) 0%, rgba(37,99,235,0.04) 32%, transparent 62%)",
          filter: "blur(80px)",
        }} />

        {/* Inner breathing halo */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{
          width: neptuneSize * 2.4,
          height: neptuneSize * 2.4,
          background: "radial-gradient(circle, rgba(37,99,235,0.16) 0%, rgba(29,78,216,0.08) 38%, transparent 65%)",
          filter: "blur(40px)",
          animation: "halo-breathe 9s ease-in-out infinite",
        }} />

        {/* Neptune */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
          style={{ animation: "pluto-float 16s ease-in-out infinite" }}>
          <NeptuneBody size={neptuneSize} />
        </div>

        {/* Neptune label */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 pointer-events-none z-10"
          style={{ marginTop: neptuneSize * 0.62 + 16 }}>
          <p className="text-center text-[10px] font-mono tracking-[0.5em] text-blue-400/30 uppercase">
            Neptune
          </p>
        </div>

        {MOONS.map(moon => (
          <OrbitingMoon
            key={moon.name}
            moon={moon}
            scale={scale}
            dimmed={selected !== null && selected.name !== moon.name}
            onClick={() => setSelected(moon)}
          />
        ))}
      </div>

      {/* Detail overlay */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
          style={{
            background: "rgba(1,8,19,0.88)",
            backdropFilter: "blur(22px)",
            animation: "detail-fade-in 0.5s ease forwards",
          }}
          onClick={() => setSelected(null)}
        >
          <div
            className="relative max-w-3xl w-full grid md:grid-cols-2 gap-8 md:gap-12 items-center"
            style={{ animation: "detail-rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Close"
              className="absolute -top-2 -right-2 md:-top-4 md:-right-4 w-10 h-10 rounded-full
                flex items-center justify-center text-white/60 hover:text-white
                bg-black/40 hover:bg-black/70 border border-blue-900/40
                backdrop-blur-md transition-all cursor-pointer z-10"
            >
              <X size={16} />
            </button>

            <div className="flex justify-center md:justify-end">
              <div style={{
                animation: "moon-zoom-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards, moon-breathe 6s ease-in-out 0.8s infinite",
              }}>
                <Body size={240} color={selected.color} highlight={selected.highlight} shadow={selected.shadow} />
              </div>
            </div>

            <div className="text-left">
              <p className="text-[10px] tracking-[0.4em] uppercase mb-2"
                style={{ color: selected.highlight + "aa" }}>
                Moon of Neptune
              </p>
              <h3 className="text-4xl md:text-5xl font-light text-white tracking-wide mb-3"
                style={{ fontStyle: "italic" }}>
                {selected.name}
              </h3>
              <p className="text-base md:text-lg font-light italic mb-6"
                style={{ color: selected.highlight }}>
                &ldquo;{selected.tagline}&rdquo;
              </p>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: "Diameter",   val: selected.diameter },
                  { label: "Discovered", val: selected.discovered },
                  { label: "Orbital",    val: selected.orbital },
                ].map(s => (
                  <div key={s.label} className="rounded-lg px-3 py-2"
                    style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(59,130,246,0.14)" }}>
                    <p className="text-[9px] tracking-[0.2em] uppercase text-blue-300/40 mb-0.5">{s.label}</p>
                    <p className="text-sm font-mono text-white/90">{s.val}</p>
                  </div>
                ))}
              </div>

              <p className="text-sm text-white/70 leading-relaxed mb-4 font-light">
                {selected.description}
              </p>
              <p className="text-xs text-blue-300/40 leading-relaxed italic font-light border-l border-blue-800/40 pl-3">
                {selected.mythos}
              </p>
            </div>
          </div>

          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.3em] text-blue-300/25 uppercase">
            Press ESC or click outside to return
          </p>
        </div>
      )}
    </section>
  );
}
