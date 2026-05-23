import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AAOS Research",
  description: "Autonomous AI OS — intelligence running inside a custom 32-bit OS kernel",
  keywords: ["AI", "OS", "kernel", "research", "autonomous"],
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
