"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import ThemeToggle from "./ThemeToggle"
import VisitorStats from "./VisitorStats"
import type { PublicVisitorStats } from "../../lib/queries"

const LINKS = [
  { href: "/", label: "Upcoming" },
  { href: "/past", label: "Past mints" },
]

export default function SiteHeader({ stats }: { stats: PublicVisitorStats }) {
  const pathname = usePathname()

  return (
    <header className="topbar">
      <div className="shell topbar__inner">
        <div className="topbar__brand">
          <Link href="/" className="wordmark">
            <span className="wordmark__dot" />
            Mint Deck
          </Link>
          <VisitorStats initial={stats} />
        </div>
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
