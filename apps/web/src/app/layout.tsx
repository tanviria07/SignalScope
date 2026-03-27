import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { Nav } from "@/components/Nav";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SignalScope",
  description:
    "Inspect time-series behavior with segmentation, anomaly detection, and signal-quality insights.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="min-h-screen font-sans">
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-16 pt-6 sm:px-6 lg:px-10">
          <Nav />
          <main className="flex-1">{children}</main>
          <footer className="mt-12 border-t border-surface-border pt-6 text-xs leading-5 text-ink-faint">
            SignalScope — local analysis; data stays on your machine unless you configure otherwise.
          </footer>
        </div>
      </body>
    </html>
  );
}
