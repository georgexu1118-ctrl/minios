import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AAOS Research",
  description: "A Hermes-powered AI agent running inside a hand-crafted 32-bit x86 kernel — live market data, web search, and reasoning streamed via Next.js",
  keywords: ["AI", "OS", "kernel", "research", "autonomous", "Hermes", "Nous Research"],
  metadataBase: new URL("https://aaos-research.vercel.app"),
  openGraph: {
    title: "AAOS Research — Autonomous AI OS",
    description: "A Hermes-powered AI agent running inside a hand-crafted 32-bit x86 kernel — live market data, web search, and reasoning streamed via Next.js",
    url: "https://aaos-research.vercel.app",
    siteName: "AAOS Research",
    images: [
      {
        url: "/og-image.png",
        width: 1280,
        height: 720,
        alt: "AAOS Research — Our work at Nous is built on this vision",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AAOS Research — Autonomous AI OS",
    description: "A Hermes-powered AI agent running inside a hand-crafted 32-bit x86 kernel — live market data, web search, and reasoning streamed via Next.js",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full flex flex-col" style={{ background: "#04020e", color: "#ede9fe" }}>
        {children}
      </body>
    </html>
  );
}
