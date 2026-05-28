import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AAOS Research",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/og-image.png",
  },
  description: "AAOS Research is an autonomous AI lab interface with reasoning, coding, educational models, live market data, web search, and document intelligence.",
  keywords: ["AI", "OS", "kernel", "research", "autonomous", "AAOS", "NousCoder"],
  metadataBase: new URL("https://aaos-research.vercel.app"),
  openGraph: {
    title: "AAOS Research — Autonomous AI OS",
    description: "AAOS Research is an autonomous AI lab interface with reasoning, coding, educational models, live market data, web search, and document intelligence.",
    url: "https://aaos-research.vercel.app",
    siteName: "AAOS Research",
    images: [
      {
        url: "/og-image.png",
        width: 1280,
        height: 720,
        alt: "AAOS Research model lab",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AAOS Research — Autonomous AI OS",
    description: "AAOS Research is an autonomous AI lab interface with reasoning, coding, educational models, live market data, web search, and document intelligence.",
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
