"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/collections", label: "Collections" },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="topnav">
      {LINKS.map((l) => {
        const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href)
        return (
          <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}>
            {l.label}
          </Link>
        )
      })}
    </nav>
  )
}
