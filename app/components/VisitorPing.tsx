"use client"

import { useEffect } from "react"

/** Heartbeat that feeds the admin's visitor and "online now" counters. */
export default function VisitorPing() {
  useEffect(() => {
    const ping = () => {
      if (document.visibilityState !== "visible") return
      void fetch("/api/ping", { method: "POST", cache: "no-store" }).catch(() => {})
    }
    ping()
    const id = setInterval(ping, 120_000)
    document.addEventListener("visibilitychange", ping)
    return () => {
      clearInterval(id)
      document.removeEventListener("visibilitychange", ping)
    }
  }, [])

  return null
}
