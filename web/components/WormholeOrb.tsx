"use client";

export default function WormholeOrb() {
  return (
    <div className="relative w-[340px] h-[340px] mx-auto select-none animate-float">

      {/* Outermost faint ring */}
      <div className="absolute inset-[-20px] rounded-full border border-violet-700/15
        animate-spin-slow" />

      {/* Outer ring */}
      <div className="absolute inset-0 rounded-full border border-violet-500/25
        animate-spin-slow animate-pulse-ring"
        style={{ boxShadow: "0 0 40px rgba(124,58,237,0.2)" }}
      />

      {/* Second ring — faster reverse */}
      <div className="absolute inset-6 rounded-full border border-indigo-400/35
        animate-spin-reverse-fast" />

      {/* Third ring — accent */}
      <div className="absolute inset-12 rounded-full border border-violet-300/20
        animate-spin-slow-med" />

      {/* Accretion disk glow band */}
      <div className="absolute inset-[14%] rounded-full"
        style={{
          background: "conic-gradient(from 0deg, transparent 0%, rgba(124,58,237,0.5) 20%, rgba(167,139,250,0.8) 40%, rgba(34,211,238,0.4) 55%, rgba(109,40,217,0.5) 70%, transparent 100%)",
          filter: "blur(12px)",
          animation: "spin-slow 12s linear infinite",
        }}
      />

      {/* Middle glow field */}
      <div className="absolute inset-[20%] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(167,139,250,0.35) 0%, rgba(124,58,237,0.2) 45%, transparent 80%)",
        }}
      />

      {/* Inner glow core */}
      <div className="absolute inset-[35%] rounded-full animate-pulse-glow"
        style={{
          background: "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(167,139,250,0.9) 25%, rgba(124,58,237,0.7) 55%, transparent 100%)",
          boxShadow: "0 0 40px rgba(167,139,250,0.8), 0 0 80px rgba(124,58,237,0.4)",
        }}
      />

      {/* Lens flare streaks */}
      {[0, 60, 120, 180, 240, 300].map(deg => (
        <div key={deg}
          className="absolute top-1/2 left-1/2"
          style={{
            width: "1px",
            height: "120px",
            background: "linear-gradient(to bottom, rgba(167,139,250,0.6), transparent)",
            transformOrigin: "top center",
            transform: `translate(-50%, -50%) rotate(${deg}deg)`,
            filter: "blur(1px)",
            opacity: 0.3,
          }}
        />
      ))}

      {/* Outer glow halo */}
      <div className="absolute -inset-8 rounded-full"
        style={{
          background: "radial-gradient(circle, transparent 40%, rgba(124,58,237,0.1) 65%, transparent 80%)",
          filter: "blur(8px)",
        }}
      />
    </div>
  );
}
