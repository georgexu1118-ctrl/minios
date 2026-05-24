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
    size: 44,
    orbit: 210,
    duration: 75,
    startAngle: 12,
    tilt: -3,
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
    size: 9,
    orbit: 290,
    duration: 110,
    startAngle: 84,
    tilt: 2,
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
    size: 16,
    orbit: 350,
    duration: 140,
    startAngle: 156,
    tilt: -1,
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
    size: 11,
    orbit: 415,
    duration: 185,
    startAngle: 228,
    tilt: 4,
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
    size: 16,
    orbit: 485,
    duration: 230,
    startAngle: 300,
    tilt: -2,
  },
];

// Body component for any spherical world (Pluto + moons + detail close-up).
function Body({
  size, color, highlight, shadow, hasHeart = false,
}: {
  size: number; color: string; highlight: string; shadow: string; hasHeart?: boolean;
}) {
  return (
    <div
      className="relative rounded-full"
      style={{
        width: size, height: size,
        background: `radial-gradient(circle at 35% 30%, ${highlight} 0%, ${color} 30%, ${color} 50%, ${shadow} 85%, #000 100%)`,
        boxShadow:
          `inset -${size * 0.18}px -${size * 0.10}px ${size * 0.30}px rgba(0,0,0,0.7),` +
          `inset ${size * 0.05}px ${size * 0.05}px ${size * 0.20}px rgba(255,255,255,0.06),` +
          `0 0 ${size * 0.5}px ${color}33,` +
          `0 0 ${size * 1.0}px ${color}1a`,
      }}
    >
      {/* Subtle surface bands */}
      <div
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{
          backgroundImage: `repeating-linear-gradient(170deg, transparent 0%, ${shadow}22 6%, transparent 12%, ${highlight}11 18%, transparent 24%)`,
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
          background: `radial-gradient(circle, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.08) 50%, transparent 75%)`,
          filter: `blur(${Math.max(2, size * 0.012)}px)`,
        }}
      />
      {/* Sputnik Planitia "heart" — only on Pluto */}
      {hasHeart && (
        <div
          className="absolute"
          style={{
            top: `${size * 0.50}px`,
            left: `${size * 0.32}px`,
            width: size * 0.34,
            height: size * 0.24,
            background: `radial-gradient(ellipse at 30% 40%, #f5e6d3 0%, #e6c8a8 40%, transparent 75%)`,
            opacity: 0.45,
            filter: "blur(4px)",
            transform: "rotate(-12deg)",
          }}
        />
      )}
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
      if (w < 640) setScale(0.45);
      else if (w < 900) setScale(0.7);
      else if (w < 1200) setScale(0.85);
      else setScale(1);
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

  const plutoSize = 130 * scale;

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
            "radial-gradient(ellipse at 30% 20%, rgba(34,211,238,0.06) 0%, transparent 50%)," +
            "radial-gradient(ellipse at 80% 80%, rgba(164,113,72,0.05) 0%, transparent 50%)," +
            "radial-gradient(ellipse at 50% 50%, rgba(8,8,20,1) 0%, #000 80%)",
        }}
      />

      {/* Drifting particles */}
      <CosmicDust />

      {/* Subtle vignette */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ boxShadow: "inset 0 0 200px 50px rgba(0,0,0,0.85)" }}
      />

      {/* Title sequence */}
      <div className="relative z-10 pt-16 md:pt-20 text-center px-4">
        <p className="text-[10px] md:text-[11px] tracking-[0.5em] text-cyan-400/50 uppercase mb-3 animate-fade-in">
          The Pluto System
        </p>
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-light text-white tracking-wide animate-fade-in-delay-1"
          style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "0.02em" }}>
          A Museum of <span style={{
            background: "linear-gradient(135deg, #a8a29e 0%, #d4a574 50%, #67e8f9 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontStyle: "italic",
          }}>Distant Moons</span>
        </h2>
        <p className="text-violet-300/40 text-xs md:text-sm mt-4 max-w-md mx-auto animate-fade-in-delay-2 font-light tracking-wide">
          Five worlds dance around a frozen heart, 5.9 billion kilometres from the Sun.
          Hover. Click. Step closer.
        </p>
      </div>

      {/* Stage */}
      <div
        className="relative w-full flex justify-center items-center"
        style={{
          height: `${720 * scale + 100}px`,
          perspective: "1200px",
        }}
      >
        {/* Atmospheric halo */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: plutoSize * 4,
            height: plutoSize * 4,
            background: "radial-gradient(circle, rgba(164,113,72,0.12) 0%, rgba(8,145,178,0.06) 30%, transparent 65%)",
            filter: "blur(40px)",
          }}
        />

        {/* Pluto — center */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ animation: "pluto-float 12s ease-in-out infinite" }}>
          <Body
            size={plutoSize}
            color="#a47148"
            highlight="#e6c8a8"
            shadow="#2a1810"
            hasHeart
          />
        </div>

        {/* Pluto label */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 pointer-events-none"
          style={{ marginTop: plutoSize * 0.65 + 12 }}>
          <p className="text-center text-[10px] font-mono tracking-[0.4em] text-amber-200/40 uppercase">
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
