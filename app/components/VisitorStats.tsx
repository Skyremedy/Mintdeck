"use client"

import { useEffect, useState } from "react"
import type { PublicVisitorStats } from "../../lib/queries"

/**
 * Live visitor counters in the header. Seeded with server-rendered values so
 * the numbers never flash, then refreshed on a timer.
 */
export default function VisitorStats({ initial }: { initial: PublicVisitorStats }) {
  const [stats, setStats] = useState(initial)

  useEffect(() => {
    let cancelled = false
    const load = () => {
      if (document.visibilityState !== "visible") return
      fetch("/api/stats", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data: PublicVisitorStats | null) => {
          if (!cancelled && data) setStats(data)
        })
        .catch(() => {})
    }
    const id = setInterval(load, 60_000)
    document.addEventListener("visibilitychange", load)
    return () => {
      cancelled = true
      clearInterval(id)
      document.removeEventListener("visibilitychange", load)
    }
  }, [])

  return (
    <div className="vstats" aria-label="Visitor statistics">
      <span className="vstats__item">
        <span className="dot dot--pulse" />
        <span className="vstats__num num">{stats.online.toLocaleString()}</span>
        <span className="vstats__label">online</span>
      </span>
      <span className="vstats__sep" aria-hidden="true" />
      <span className="vstats__item">
        <span className="vstats__num num">{stats.total.toLocaleString()}</span>
        <span className="vstats__label">visitors</span>
      </span>
    </div>
  )
}
