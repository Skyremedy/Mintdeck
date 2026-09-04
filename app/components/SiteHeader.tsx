"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import ThemeToggle from "./ThemeToggle"

const LINKS = [
  { href: "/", label: "Upcoming" },
  { href: "/past", label: "Past mints" },
]

export default function SiteHeader() {
  const pathname = usePathname()

  return (
    <header className="topbar">
      <div className="shell topbar__inner">
        <Link href="/" className="wordmark">
          <span className="wordmark__dot" />
          Mint Deck
        </Link>
        <div className="topbar__actions">
          <nav className="topnav">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={pathname === l.href ? "page" : undefined}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
