"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import Image from "next/image";

const NAV = [
  { href: "/", label: "Research" },
  { href: "/chat", label: "Chat" },
  { href: "https://github.com/georgexu1118-ctrl/aaos", label: "GitHub", external: true },
];

export default function Navbar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 inset-x-0 z-50 glass border-b"
      style={{ borderColor: "rgba(120,60,240,0.15)" }}>
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          {/* Galileo moon engraving — tinted violet to blend with cosmic theme */}
          <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
            style={{
              boxShadow: "0 0 10px rgba(139,92,246,0.45), 0 0 20px rgba(124,58,237,0.20)",
              border: "1px solid rgba(139,92,246,0.45)",
            }}>
            <Image
              src="/galileo-moon.webp"
              alt="AAOS"
              width={32}
              height={32}
              className="w-full h-full object-cover object-top"
              style={{
                filter: "sepia(1) hue-rotate(222deg) saturate(2.2) brightness(0.72) contrast(1.25)",
                transform: "scale(1.08)",
              }}
              priority
            />
            {/* Subtle violet overlay to deepen blend */}
            <div className="absolute inset-0 rounded-full pointer-events-none"
              style={{ background: "rgba(88,28,235,0.18)", mixBlendMode: "multiply" }} />
          </div>
          <span className="text-sm font-bold tracking-[0.15em] uppercase text-gradient">
            AAOS
          </span>
          <span className="text-sm font-light tracking-widest text-violet-400/60 uppercase hidden sm:inline">
            Research
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV.map(n => {
            const active = !n.external && path === n.href;
            const Tag = n.external ? "a" : Link;
            const extraProps = n.external ? { target: "_blank", rel: "noopener noreferrer" } : {};
            return (
              <Tag
                key={n.href}
                href={n.href}
                {...extraProps}
                className={`px-4 py-1.5 rounded-lg text-[13px] tracking-wide transition-all duration-200
                  ${active
                    ? "text-violet-200 bg-violet-800/30 border border-violet-600/30"
                    : "text-violet-400/70 hover:text-violet-200 hover:bg-violet-900/30"
                  }`}
              >
                {n.label}
              </Tag>
            );
          })}
          <Link href="/chat"
            className="ml-3 px-4 py-1.5 rounded-lg text-[13px] font-medium tracking-wide
              btn-shimmer text-white border-0 cursor-pointer">
            Launch AI →
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden text-violet-300" onClick={() => setOpen(o => !o)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden glass border-t px-4 py-3 flex flex-col gap-1"
          style={{ borderColor: "rgba(120,60,240,0.12)" }}>
          {NAV.map(n => {
            const Tag = n.external ? "a" : Link;
            const extraProps = n.external ? { target: "_blank", rel: "noopener noreferrer" } : {};
            return (
              <Tag key={n.href} href={n.href} {...extraProps}
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-lg text-sm text-violet-300 hover:bg-violet-900/30 transition-colors">
                {n.label}
              </Tag>
            );
          })}
          <Link href="/chat" onClick={() => setOpen(false)}
            className="mt-1 px-3 py-2 rounded-lg text-sm font-medium text-white btn-shimmer text-center">
            Launch AI →
          </Link>
        </div>
      )}
    </nav>
  );
}
