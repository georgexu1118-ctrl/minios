"use client";

export default function NebulaLayers() {
  return (
    <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none" aria-hidden="true">

      {/* Large violet nebula — top-left */}
      <div
        className="absolute -top-[20%] -left-[15%] w-[75vw] h-[80vh] rounded-full
          animate-nebula-drift"
        style={{
          background: "radial-gradient(ellipse at center, rgba(109,40,217,0.22) 0%, rgba(76,29,149,0.12) 40%, transparent 75%)",
          filter: "blur(60px)",
        }}
      />

      {/* Blue nebula — bottom-right */}
      <div
        className="absolute -bottom-[25%] -right-[10%] w-[65vw] h-[70vh] rounded-full
          animate-nebula-drift-slow"
        style={{
          background: "radial-gradient(ellipse at center, rgba(29,78,216,0.2) 0%, rgba(30,58,138,0.1) 45%, transparent 75%)",
          filter: "blur(70px)",
        }}
      />

      {/* Magenta accent — upper-right */}
      <div
        className="absolute top-[5%] right-[5%] w-[45vw] h-[45vh] rounded-full
          animate-nebula-drift"
        style={{
          background: "radial-gradient(ellipse at center, rgba(168,85,247,0.13) 0%, rgba(139,92,246,0.06) 50%, transparent 80%)",
          filter: "blur(50px)",
          animationDelay: "-12s",
        }}
      />

      {/* Cyan accent — center */}
      <div
        className="absolute top-[40%] left-[30%] w-[40vw] h-[30vh] rounded-full
          animate-nebula-drift-slow"
        style={{
          background: "radial-gradient(ellipse at center, rgba(6,182,212,0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
          animationDelay: "-20s",
        }}
      />

      {/* Orange/amber hot star region — bottom-center (Interstellar Gargantua feel) */}
      <div
        className="absolute bottom-[10%] left-[45%] w-[30vw] h-[25vh] rounded-full"
        style={{
          background: "radial-gradient(ellipse at center, rgba(251,146,60,0.06) 0%, rgba(217,119,6,0.04) 40%, transparent 75%)",
          filter: "blur(35px)",
        }}
      />

      {/* Deep violet band across mid-screen */}
      <div
        className="absolute top-[35%] inset-x-0 h-[30vh]"
        style={{
          background: "linear-gradient(180deg, transparent, rgba(88,28,235,0.06) 50%, transparent)",
          filter: "blur(20px)",
        }}
      />
    </div>
  );
}
