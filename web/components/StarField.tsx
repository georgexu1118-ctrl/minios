"use client";
import { useEffect, useRef } from "react";

interface Star {
  x: number; y: number; z: number;
  px: number; py: number;
  size: number; speed: number; twinkle: number; twinkleSpeed: number;
}

export default function StarField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let w = 0, h = 0;
    const STAR_COUNT = 320;
    const stars: Star[] = [];

    function resize() {
      w = canvas!.width  = window.innerWidth;
      h = canvas!.height = window.innerHeight;
    }

    function mkStar(): Star {
      return {
        x: (Math.random() - 0.5) * w * 2,
        y: (Math.random() - 0.5) * h * 2,
        z: Math.random() * w,
        px: 0, py: 0,
        size: Math.random() * 1.4 + 0.2,
        speed: Math.random() * 0.3 + 0.05,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
      };
    }

    function init() {
      resize();
      stars.length = 0;
      for (let i = 0; i < STAR_COUNT; i++) stars.push(mkStar());
    }

    function draw() {
      ctx!.fillStyle = "rgba(4, 2, 14, 0.18)";
      ctx!.fillRect(0, 0, w, h);

      for (const s of stars) {
        s.twinkle += s.twinkleSpeed;
        const brightness = 0.5 + 0.5 * Math.sin(s.twinkle);

        // Project
        const k  = 128 / s.z;
        const sx = s.x * k + w / 2;
        const sy = s.y * k + h / 2;

        if (sx < 0 || sx > w || sy < 0 || sy > h) {
          Object.assign(s, mkStar(), { z: w });
          continue;
        }

        const size = Math.max(0.1, (1 - s.z / w) * s.size * 2.5);
        const alpha = Math.min(1, brightness * (1 - s.z / w) * 1.6);

        // Slight color tint — white + violet + cyan
        const tint = Math.random() > 0.92
          ? `rgba(167,139,250,${alpha})`
          : Math.random() > 0.95
            ? `rgba(34,211,238,${alpha})`
            : `rgba(255,255,255,${alpha})`;

        ctx!.beginPath();
        ctx!.arc(sx, sy, size, 0, Math.PI * 2);
        ctx!.fillStyle = tint;
        ctx!.fill();

        if (size > 1.2) {
          // Add a soft glow for bright stars
          const grd = ctx!.createRadialGradient(sx, sy, 0, sx, sy, size * 3);
          grd.addColorStop(0, `rgba(200,180,255,${alpha * 0.4})`);
          grd.addColorStop(1, "transparent");
          ctx!.beginPath();
          ctx!.arc(sx, sy, size * 3, 0, Math.PI * 2);
          ctx!.fillStyle = grd;
          ctx!.fill();
        }

        s.px = sx; s.py = sy;
        s.z -= s.speed;
        if (s.z <= 0) Object.assign(s, mkStar(), { z: w });
      }

      animId = requestAnimationFrame(draw);
    }

    init();
    draw();
    window.addEventListener("resize", init);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", init);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="fixed inset-0 -z-30 pointer-events-none"
      aria-hidden="true"
    />
  );
}
