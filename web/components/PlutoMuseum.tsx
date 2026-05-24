"use client";
import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

// ---------------------------------------------------------------------------
// The Pluto System — a cinematic, click-to-explore museum of Pluto + 5 moons
// ---------------------------------------------------------------------------

interface Moon {
  name: string;
  diameter: string;
  discovered: string;
  orbital: string;
  tagline: string;
  description: string;
  mythos: string;
  color: string;        // base body color
  highlight: string;    // illuminated side
  shadow: string;       // dark side
  size: number;         // body diameter in px
  orbit: number;        // orbit radius in px
  duration: number;     // seconds per revolution
  startAngle: number;   // initial angular position (deg)
  tilt: number;         // orbital tilt (deg) — adds a subtle 3D feel
}

const MOONS: Moon[] = [
  {
    name: "Charon",
    diameter: "1,212 km",
    discovered: "1978",
    orbital: "6.4 days",
    tagline: "The silent twin.",
    description:
      "Half the diameter of Pluto itself, Charon is so massive that the two bodies orbit a point in empty space between them. Tidally locked, they show each other the same face forever — a slow, patient waltz at the edge of the solar system.",
    mythos: "Ferryman of the dead, carrying souls across the river Styx.",
    color: "#a8a29e",
    highlight: "#e7e5e4",
    shadow: "#3a3633",
    size: 90,
    orbit: 340,
    duration: 140,
    startAngle: 12,
    tilt: -4,
  },
  {
    name: "Styx",
    diameter: "16 km",
    discovered: "2012",
    orbital: "20.2 days",
    tagline: "A fleck of ice on the edge of memory.",
    description:
      "Smallest of the inner moons, Styx is an irregular shard tumbling along a near-perfect circular orbit. Discovered only thirteen years ago, it is one of the most recent additions to the human map of our solar system.",
    mythos: "The river separating the living from the dead.",
    color: "#a3a3a3",
    highlight: "#d4d4d4",
    shadow: "#2a2a2a",
    size: 26,
    orbit: 440,
    duration: 200,
    startAngle: 84,
    tilt: 3,
  },
  {
    name: "Nix",
    diameter: "49 km",
    discovered: "2005",
    orbital: "24.9 days",
    tagline: "Goddess of darkness and night.",
    description:
      "Nix tumbles chaotically as it orbits — its rotation period changes from one circuit to the next. From its surface, Pluto would appear sometimes as a half-disc, sometimes a thin crescent, never twice the same.",
    mythos: "Primordial Greek deity from whom even the gods recoiled.",
    color: "#c4b5a0",
    highlight: "#ede4d4",
    shadow: "#3e342a",
    size: 42,
    orbit: 540,
    duration: 260,
    startAngle: 156,
    tilt: -2,
  },
  {
    name: "Kerberos",
    diameter: "19 km",
    discovered: "2011",
    orbital: "32.2 days",
    tagline: "The three-headed hound.",
    description:
      "A double-lobed body — two icy fragments fused together long ago — Kerberos is the darkest of Pluto's moons. New Horizons revealed two lobes joined at a narrow neck, like a frozen peanut adrift in starlight.",
    mythos: "The hound of Hades guarding the gates of the underworld.",
    color: "#78716c",
    highlight: "#a8a29e",
    shadow: "#1c1917",
    size: 32,
    orbit: 640,
    duration: 340,
    startAngle: 228,
    tilt: 5,
  },
  {
    name: "Hydra",
    diameter: "51 km",
    discovered: "2005",
    orbital: "38.2 days",
    tagline: "The nine-headed serpent.",
    description:
      "Outermost of the five known moons, Hydra is a bright body of nearly pure water ice — the cleanest surface in the system. It completes a single revolution while Earth circles the Sun a tenth of the way.",
    mythos: "The serpent slain by Heracles, growing two heads for each one cut.",
    color: "#d6d3d1",
    highlight: "#f5f5f4",
    shadow: "#44403c",
    size: 44,
    orbit: 750,
    duration: 420,
    startAngle: 300,
    tilt: -3,
  },
];

// Realistic Pluto body — layered terrain zones, Sputnik Planitia heart, blue N₂ atmosphere.
function PlutoBody({ size }: { size: number }) {
  const blur = (f: number) => `${Math.max(1, size * f)}px`;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Blue nitrogen atmosphere ring — visible outside the disc */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: `-${size * 0.045}px`,
          background: "transparent",
          boxShadow:
            `0 0 ${size * 0.14}px ${size * 0.05}px rgba(34,211,238,0.22),` +
            `0 0 ${size * 0.06}px rgba(34,211,238,0.35)`,
        }}
      />

      {/* Main sphere */}
      <div
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{
          /* Base tholin reddish-brown terrain, lit from upper-left */
          background:
            "radial-gradient(circle at 36% 34%, #c47e52 0%, #a05534 18%, #7a3a1c 36%, #4e2008 58%, #1e0a02 80%, #000 100%)",
          boxShadow:
            `0 0 ${size * 0.5}px rgba(160,85,52,0.28),` +
            `0 0 ${size * 1.0}px rgba(160,85,52,0.10),` +
            `inset -${size * 0.22}px -${size * 0.12}px ${size * 0.35}px rgba(0,0,0,0.75),` +
            `inset ${size * 0.04}px ${size * 0.04}px ${size * 0.18}px rgba(255,200,160,0.05)`,
        }}
      >
        {/* Mid-latitude lighter ochre band */}
        <div
          className="absolute"
          style={{
            top: "18%", left: "0%",
            width: "75%", height: "40%",
            background: "radial-gradient(ellipse at 45% 50%, rgba(196,148,80,0.30) 0%, rgba(164,110,50,0.12) 55%, transparent 80%)",
            filter: `blur(${blur(0.06)})`,
          }}
        />

        {/* Cthulhu Regio — the dark equatorial "whale" patch */}
        <div
          className="absolute"
          style={{
            top: "48%", left: "-4%",
            width: "56%", height: "30%",
            background:
              "radial-gradient(ellipse at 40% 50%, #0e0502 0%, #1c0a04 40%, #2a1208 65%, transparent 85%)",
            filter: `blur(${blur(0.04)})`,
            opacity: 0.88,
          }}
        />

        {/* Sputnik Planitia — right lobe of heart (main nitrogen ice basin) */}
        <div
          className="absolute"
          style={{
            top: "30%", left: "40%",
            width: "46%", height: "40%",
            background:
              "radial-gradient(ellipse at 38% 45%, #f8f2e8 0%, #ede2cc 28%, #d8c8a8 55%, transparent 80%)",
            filter: `blur(${blur(0.018)})`,
            transform: "rotate(-12deg)",
            opacity: 0.94,
          }}
        />

        {/* Tombaugh Regio left lobe — slightly dimmer arm of the heart */}
        <div
          className="absolute"
          style={{
            top: "22%", left: "30%",
            width: "24%", height: "30%",
            background:
              "radial-gradient(ellipse at 55% 60%, #eeddc8 0%, #d8c4a0 40%, transparent 75%)",
            filter: `blur(${blur(0.024)})`,
            transform: "rotate(14deg)",
            opacity: 0.82,
          }}
        />

        {/* Heart connector bridge — joins the two lobes */}
        <div
          className="absolute"
          style={{
            top: "38%", left: "36%",
            width: "16%", height: "14%",
            background: "radial-gradient(ellipse, rgba(220,200,168,0.75) 0%, transparent 70%)",
            filter: `blur(${blur(0.028)})`,
            opacity: 0.70,
          }}
        />

        {/* Surface banding — scoured terrain texture */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(162deg, transparent 0%, rgba(60,20,8,0.18) 4%, transparent 8%, rgba(180,120,60,0.07) 12%, transparent 17%)",
            mixBlendMode: "overlay",
          }}
        />

        {/* Northern polar bright zone (methane ice cap) */}
        <div
          className="absolute"
          style={{
            top: "-10%", left: "22%",
            width: "56%", height: "34%",
            background:
              "radial-gradient(ellipse at 50% 55%, rgba(240,220,190,0.22) 0%, transparent 65%)",
            filter: `blur(${blur(0.05)})`,
          }}
        />

        {/* Blue nitrogen atmospheric limb — inner edge glow */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, transparent 44%, rgba(34,211,238,0.04) 58%, rgba(34,211,238,0.10) 72%, rgba(103,232,249,0.16) 84%, rgba(34,211,238,0.08) 93%, transparent 100%)",
          }}
        />

        {/* Terminator — shadow from upper-left light source */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 68% 58%, transparent 28%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.78) 88%)",
          }}
        />

        {/* Primary specular highlight */}
        <div
          className="absolute rounded-full"
          style={{
            top: `${size * 0.09}px`,
            left: `${size * 0.22}px`,
            width: size * 0.20,
            height: size * 0.13,
            background:
              "radial-gradient(circle, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.08) 55%, transparent 78%)",
            filter: `blur(${blur(0.011)})`,
          }}
        />

        {/* Secondary soft sheen near heart */}
        <div
          className="absolute"
          style={{
            top: `${size * 0.32}px`,
            left: `${size * 0.42}px`,
            width: size * 0.28,
            height: size * 0.14,
            background: "radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)",
            filter: `blur(${blur(0.02)})`,
          }}
        />
      </div>
    </div>
  );
}

// Generic spherical body for moons.
function Body({
  size, color, highlight, shadow,
}: {
  size: number; color: string; highlight: string; shadow: string;
}) {
  return (
    <div
      className="relative rounded-full overflow-hidden"
      style={{
        width: size, height: size,
        background: `radial-gradient(circle at 35% 30%, ${highlight} 0%, ${color} 28%, ${color} 52%, ${shadow} 82%, #000 100%)`,
        boxShadow:
          `inset -${size * 0.18}px -${size * 0.10}px ${size * 0.30}px rgba(0,0,0,0.72),` +
          `inset ${size * 0.05}px ${size * 0.05}px ${size * 0.18}px rgba(255,255,255,0.06),` +
          `0 0 ${size * 0.5}px ${color}33,` +
          `0 0 ${size * 1.0}px ${color}1a`,
      }}
    >
      {/* Subtle surface banding */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(170deg, transparent 0%, ${shadow}22 5%, transparent 10%, ${highlight}0f 16%, transparent 22%)`,
          mixBlendMode: "overlay",
        }}
      />
      {/* Specular highlight */}
      <div
        className="absolute rounded-full"
        style={{
          top: `${size * 0.10}px`,
          left: `${size * 0.22}px`,
          width: size * 0.22,
          height: size * 0.14,
          background: `radial-gradient(circle, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.08) 52%, transparent 76%)`,
          filter: `blur(${Math.max(1, size * 0.012)}px)`,
        }}
      />
      {/* Terminator */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at 70% 55%, transparent 35%, rgba(0,0,0,0.45) 65%, rgba(0,0,0,0.80) 92%)",
        }}
      />
    </div>
  );
}

// One moon in orbit. The wrapper rotates; the moon counter-rotates so its
// surface always faces the viewer.
function OrbitingMoon({
  moon, dimmed, onClick, scale,
}: {
  moon: Moon; dimmed: boolean; onClick: () => void; scale: number;
}) {
  const r = moon.orbit * scale;
  const sz = moon.size * scale;

  return (
    <>
      {/* Orbit ring */}
      <div
        className="absolute left-1/2 top-1/2 pointer-events-none rounded-full"
        style={{
          width: r * 2, height: r * 2,
          marginLeft: -r, marginTop: -r,
          border: "1px solid rgba(168, 162, 158, 0.06)",
          transform: `rotateX(${74 + moon.tilt}deg)`,
        }}
      />

      {/* Orbiting body */}
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: 0, height: 0,
          transform: `rotateX(${74 + moon.tilt}deg) rotate(${moon.startAngle}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        <div
          style={{
            width: 0, height: 0,
            animation: `orbit-spin ${moon.duration}s linear infinite`,
          }}
        >
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
              opacity: dimmed ? 0.18 : 1,
              border: "none", background: "transparent", padding: 0,
            }}
          >
            <div className="relative group">
              <Body size={sz} color={moon.color} highlight={moon.highlight} shadow={moon.shadow} />
              {/* Hover ring */}
              <div
                className="absolute -inset-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  border: `1px solid ${moon.highlight}55`,
                  boxShadow: `0 0 16px ${moon.highlight}33`,
                }}
              />
              {/* Hover label */}
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

// Drifting starfield particles for ambient depth.
function CosmicDust() {
  const dots = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: Math.random() * 1.6 + 0.4,
    delay: Math.random() * 6,
    duration: 4 + Math.random() * 6,
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
            background: "rgba(255,255,255,0.7)",
            boxShadow: "0 0 4px rgba(255,255,255,0.4)",
            animation: `dust-twinkle ${d.duration}s ease-in-out ${d.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export default function PlutoMuseum() {
  const [selected, setSelected] = useState<Moon | null>(null);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Responsive scale: shrink the whole system on narrow viewports.
  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      if (w < 640) setScale(0.38);
      else if (w < 900) setScale(0.6);
      else if (w < 1200) setScale(0.8);
      else if (w < 1600) setScale(0.95);
      else setScale(1.1);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // ESC to close detail.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelected(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const plutoSize = 240 * scale;

  return (
    <section
      ref={containerRef}
      className="relative w-full overflow-hidden bg-black"
      style={{ minHeight: "100vh" }}
    >
      {/* Deep cosmos background */}
      <div className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 22% 14%, rgba(34,211,238,0.06) 0%, transparent 42%)," +
            "radial-gradient(ellipse at 80% 80%, rgba(160,85,52,0.07) 0%, transparent 48%)," +
            "radial-gradient(ellipse at 60% 20%, rgba(103,232,249,0.03) 0%, transparent 35%)," +
            "radial-gradient(ellipse at 50% 50%, rgba(18,8,4,1) 0%, #000 70%)",
        }}
      />

      {/* Distant sun — a single bright point in the upper-left, 5.9 billion km away */}
      <div className="absolute pointer-events-none"
        style={{
          top: "12%", left: "18%",
          width: 4, height: 4,
          borderRadius: "50%",
          background: "#fef3c7",
          boxShadow: "0 0 12px rgba(254,243,199,0.9), 0 0 40px rgba(254,243,199,0.4), 0 0 80px rgba(254,243,199,0.15)",
        }}
      />

      {/* Drifting particles */}
      <CosmicDust />

      {/* Cinematic letterbox bars */}
      <div className="absolute top-0 inset-x-0 pointer-events-none z-20"
        style={{ height: "60px", background: "linear-gradient(to bottom, rgba(0,0,0,0.95), transparent)" }}
      />
      <div className="absolute bottom-0 inset-x-0 pointer-events-none z-20"
        style={{ height: "100px", background: "linear-gradient(to top, rgba(0,0,0,0.95), transparent)" }}
      />

      {/* Deep vignette */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ boxShadow: "inset 0 0 300px 80px rgba(0,0,0,0.95)" }}
      />

      {/* Title sequence — minimal, recedes to let the scene breathe */}
      <div className="relative z-10 pt-20 md:pt-24 text-center px-4">
        <p className="text-[9px] md:text-[10px] tracking-[0.6em] text-cyan-400/40 uppercase mb-4 animate-fade-in">
          The Pluto System
        </p>
        <h2 className="text-2xl md:text-4xl font-extralight text-white/90 tracking-wide animate-fade-in-delay-1"
          style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "0.04em" }}>
          A Museum of <span style={{
            background: "linear-gradient(135deg, #d4a574 0%, #e6c8a8 50%, #67e8f9 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontStyle: "italic",
            fontWeight: 300,
          }}>Distant Moons</span>
        </h2>
        <p className="text-violet-300/30 text-[11px] md:text-xs mt-3 max-w-sm mx-auto animate-fade-in-delay-2 font-light tracking-[0.15em]">
          Five worlds dance around a frozen heart. Click to step closer.
        </p>
      </div>

      {/* Stage — slow camera dolly-in for cinematic entrance */}
      <div
        className="relative w-full flex justify-center items-center"
        style={{
          height: `${1100 * scale + 120}px`,
          perspective: "1800px",
          animation: "stage-dolly-in 6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        {/* Outer warm tholin glow */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: plutoSize * 5,
            height: plutoSize * 5,
            background: "radial-gradient(circle, rgba(160,85,52,0.07) 0%, rgba(8,145,178,0.03) 32%, transparent 65%)",
            filter: "blur(70px)",
          }}
        />

        {/* Inner warm halo — breathes gently */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: plutoSize * 2.4,
            height: plutoSize * 2.4,
            background: "radial-gradient(circle, rgba(200,140,80,0.14) 0%, rgba(160,85,52,0.07) 38%, transparent 65%)",
            filter: "blur(36px)",
            animation: "halo-breathe 8s ease-in-out infinite",
          }}
        />

        {/* Blue atmospheric backscatter halo */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: plutoSize * 1.28,
            height: plutoSize * 1.28,
            borderRadius: "50%",
            background: "transparent",
            boxShadow: `0 0 ${plutoSize * 0.18}px ${plutoSize * 0.06}px rgba(34,211,238,0.18), 0 0 ${plutoSize * 0.08}px rgba(34,211,238,0.28)`,
            animation: "halo-breathe 10s ease-in-out 2s infinite",
          }}
        />

        {/* Pluto — center */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
          style={{ animation: "pluto-float 14s ease-in-out infinite" }}>
          <PlutoBody size={plutoSize} />
        </div>

        {/* Pluto label */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 pointer-events-none z-10"
          style={{ marginTop: plutoSize * 0.62 + 16 }}>
          <p className="text-center text-[10px] font-mono tracking-[0.5em] text-amber-200/35 uppercase">
            Pluto
          </p>
        </div>

        {/* Orbits + moons */}
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
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(20px)",
            animation: "detail-fade-in 0.5s ease forwards",
          }}
          onClick={() => setSelected(null)}
        >
          <div
            className="relative max-w-3xl w-full grid md:grid-cols-2 gap-8 md:gap-12 items-center"
            style={{ animation: "detail-rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Close"
              className="absolute -top-2 -right-2 md:-top-4 md:-right-4 w-10 h-10 rounded-full
                flex items-center justify-center text-white/60 hover:text-white
                bg-black/40 hover:bg-black/70 border border-white/10
                backdrop-blur-md transition-all cursor-pointer z-10"
            >
              <X size={16} />
            </button>

            {/* Large moon body */}
            <div className="flex justify-center md:justify-end">
              <div
                style={{
                  animation: "moon-zoom-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards, moon-breathe 6s ease-in-out 0.8s infinite",
                }}
              >
                <Body
                  size={240}
                  color={selected.color}
                  highlight={selected.highlight}
                  shadow={selected.shadow}
                />
              </div>
            </div>

            {/* Details */}
            <div className="text-left">
              <p className="text-[10px] tracking-[0.4em] uppercase mb-2"
                style={{ color: selected.highlight + "aa" }}>
                Moon of Pluto
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
                  <div key={s.label}
                    className="rounded-lg px-3 py-2"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <p className="text-[9px] tracking-[0.2em] uppercase text-white/40 mb-0.5">{s.label}</p>
                    <p className="text-sm font-mono text-white/90">{s.val}</p>
                  </div>
                ))}
              </div>

              <p className="text-sm text-white/70 leading-relaxed mb-4 font-light">
                {selected.description}
              </p>
              <p className="text-xs text-white/40 leading-relaxed italic font-light border-l border-white/15 pl-3">
                {selected.mythos}
              </p>
            </div>
          </div>

          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.3em] text-white/30 uppercase">
            Press ESC or click outside to return
          </p>
        </div>
      )}
    </section>
  );
}
