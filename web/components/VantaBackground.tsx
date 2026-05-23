"use client";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    VANTA: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    THREE: any;
  }
}

export default function VantaBackground() {
  const ref = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const effect = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (typeof window === "undefined") return;

      // Dynamically load Three.js then Vanta to avoid SSR issues
      if (!window.THREE) {
        await import("three").then((mod) => {
          window.THREE = mod;
        });
      }

      if (!window.VANTA) {
        // @ts-expect-error — vanta has no TS types
        await import("vanta/dist/vanta.net.min").catch(() => {
          // fallback: vanta is optional, swallow error
        });
      }

      if (cancelled || !ref.current || !window.VANTA?.NET) return;

      effect.current = window.VANTA.NET({
        el: ref.current,
        THREE: window.THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200,
        minWidth: 200,
        scale: 1.0,
        scaleMobile: 1.0,
        color: 0x7c3aed,
        backgroundColor: 0x060412,
        points: 12,
        maxDistance: 20,
        spacing: 18,
      });
    }

    init();
    return () => {
      cancelled = true;
      effect.current?.destroy();
    };
  }, []);

  return (
    <div
      ref={ref}
      className="fixed inset-0 -z-10"
      aria-hidden="true"
    />
  );
}
