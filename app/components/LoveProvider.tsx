"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

type Entry = { count: number; loved: boolean }

type LoveApi = {
  get: (id: number) => Entry
  toggle: (id: number) => void
}

const LoveContext = createContext<LoveApi | null>(null)

/**
 * Holds love state for every tile on the page.
 *
 * Counts arrive server-rendered so the numbers never flash, and a single
 * request on mount says which of them this browser has loved — one fetch for
 * the whole grid rather than one per tile.
 */
export default function LoveProvider({
  seed,
  children,
}: {
  seed: { id: number; loveCount: number }[]
  children: React.ReactNode
}) {
  const [entries, setEntries] = useState<Record<number, Entry>>(() =>
    Object.fromEntries(seed.map((s) => [s.id, { count: s.loveCount, loved: false }]))
  )

  useEffect(() => {
    let cancelled = false
    fetch("/api/love", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { loved: number[] } | null) => {
        if (cancelled || !data) return
        setEntries((prev) => {
          const next = { ...prev }
          for (const id of data.loved) {
            if (next[id]) next[id] = { ...next[id], loved: true }
          }
          return next
        })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const toggle = useCallback((id: number) => {
    let before: Entry | undefined

    setEntries((prev) => {
      const current = prev[id]
      if (!current) return prev
      before = current
      return {
        ...prev,
        [id]: {
          loved: !current.loved,
          count: current.count + (current.loved ? -1 : 1),
        },
      }
    })

    void fetch("/api/love", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ collectionId: id }),
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("failed")
        const data: { count: number; loved: boolean } = await res.json()
        setEntries((prev) => ({ ...prev, [id]: { count: data.count, loved: data.loved } }))
      })
      .catch(() => {
        // Roll back to exactly what was there before the optimistic update.
        setEntries((prev) => (before ? { ...prev, [id]: before } : prev))
      })
  }, [])

  const api = useMemo<LoveApi>(
    () => ({
      get: (id) => entries[id] ?? { count: 0, loved: false },
      toggle,
    }),
    [entries, toggle]
  )

  return <LoveContext.Provider value={api}>{children}</LoveContext.Provider>
}

export function useLove(id: number) {
  const ctx = useContext(LoveContext)
  const entry = ctx?.get(id) ?? { count: 0, loved: false }
  return {
    ...entry,
    toggle: () => ctx?.toggle(id),
  }
}
