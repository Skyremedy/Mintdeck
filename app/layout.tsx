import type { Metadata } from "next"
import { Inter } from "next/font/google"
import InlineScript from "./components/InlineScript"
import { THEME_INIT_SCRIPT } from "../lib/theme"
import "./globals.css"

// Self-hosted by Next at build time — no render-blocking request to Google.
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Mint Deck — upcoming Arc mints",
  description: "Discover upcoming NFT mints on Arc — trending, just listed, GameFi, PFP and art.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The inline script below stamps data-theme before paint, so the server
    // markup and the hydrated markup differ by that attribute by design.
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <InlineScript html={THEME_INIT_SCRIPT} />
      </head>
      <body>{children}</body>
    </html>
  )
}
