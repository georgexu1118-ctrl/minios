"use client";

// Animated teal/cyan planet that rises from the bottom of the page —
// inspired by the Nous Research hero planet aesthetic.
// Pure CSS + inline styles, no canvas/Three.js dependency.
export default function NousPlanet() {
  return (
    <div className="relative w-full flex justify-center overflow-hidden"
      style={{ height: "320px", marginBottom: "-1px" }}>

      {/* Wide atmospheric haze behind the planet */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: "120vw",
          height: "260px",
          background: "radial-gradient(ellipse at 50% 100%, rgba(34,211,238,0.10) 0%, rgba(8,145,178,0.05) 40%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Horizon glow line */}
      <div className="absolute pointer-events-none"
        style={{
          bottom: "0px",
          left: 0, right: 0,
          height: "1px",
          background: "linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.25) 25%, rgba(103,232,249,0.5) 50%, rgba(34,211,238,0.25) 75%, transparent 100%)",
        }}
      />

      {/* Planet — positioned so ~45% shows above the fold */}
      <div className="absolute left-1/2 -translate-x-1/2 planet-container"
        style={{ bottom: "-290px", width: "560px", height: "560px" }}>

        {/* Atmospheric glow ring */}
        <div className="planet-glow-ring" style={{
          position: "absolute",
          inset: "-18px",
          borderRadius: "50%",
          background: "radial-gradient(circle, transparent 46%, rgba(34,211,238,0.05) 52%, rgba(34,211,238,0.13) 60%, rgba(34,211,238,0.04) 70%, transparent 78%)",
        }} />

        {/* Thin orbit ring */}
        <div style={{
          position: "absolute",
          inset: "-28px",
          borderRadius: "50%",
          border: "1px solid rgba(34,211,238,0.12)",
          boxShadow: "0 0 16px rgba(34,211,238,0.06)",
        }} />

        {/* Main planet body */}
        <div style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          overflow: "hidden",
          boxShadow:
            "0 0 80px rgba(34,211,238,0.22), " +
            "0 0 160px rgba(34,211,238,0.10), " +
            "inset -80px -40px 120px rgba(0,0,0,0.75), " +
            "inset 20px 20px 60px rgba(103,232,249,0.08)",
        }}>

          {/* Base ocean/atmosphere gradient */}
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(circle at 38% 32%, #a5f3fc 0%, #22d3ee 8%, #0891b2 22%, #0e7490 38%, #155e75 55%, #083344 72%, #031520 88%, #010b12 100%)",
          }} />

          {/* Rotating surface bands */}
          <div className="planet-bands" style={{
            position: "absolute", inset: 0,
            backgroundImage: "repeating-linear-gradient(172deg, transparent 0%, rgba(14,116,144,0.22) 6%, transparent 12%, rgba(8,145,178,0.10) 18%, transparent 24%)",
            backgroundSize: "200% 100%",
          }} />

          {/* Continent patches */}
          <div style={{ position: "absolute", top: "26%", left: "12%", width: "38%", height: "20%", borderRadius: "60% 40% 65% 35% / 55% 60% 40% 45%", background: "rgba(8,51,68,0.55)", filter: "blur(12px)" }} />
          <div style={{ position: "absolute", top: "52%", left: "48%", width: "30%", height: "18%", borderRadius: "50% 60% 40% 55%", background: "rgba(7,42,56,0.50)", filter: "blur(9px)" }} />
          <div style={{ position: "absolute", top: "68%", left: "18%", width: "22%", height: "13%", borderRadius: "50%", background: "rgba(8,51,68,0.45)", filter: "blur(8px)" }} />
          <div style={{ position: "absolute", top: "38%", left: "65%", width: "18%", height: "22%", borderRadius: "50% 40% 60% 45%", background: "rgba(6,36,48,0.45)", filter: "blur(10px)" }} />

          {/* Primary specular highlight */}
          <div style={{
            position: "absolute", top: "8%", left: "26%",
            width: "22%", height: "14%",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.06) 50%, transparent 70%)",
            filter: "blur(5px)",
          }} />

          {/* Secondary soft highlight */}
          <div style={{
            position: "absolute", top: "18%", left: "20%",
            width: "12%", height: "8%",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            filter: "blur(4px)",
          }} />

          {/* Terminator — right-side shadow darkening */}
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(circle at 72% 50%, transparent 38%, rgba(0,0,0,0.45) 65%, rgba(0,0,0,0.82) 95%)",
          }} />

          {/* Polar cap highlight (top) */}
          <div style={{
            position: "absolute", top: "-5%", left: "30%",
            width: "40%", height: "20%",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(103,232,249,0.18) 0%, transparent 70%)",
            filter: "blur(8px)",
          }} />
        </div>
      </div>
    </div>
  );
}
