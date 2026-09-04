"use client"

import { useEffect, useRef, useState } from "react"
import { ALL_CHAINS } from "../../lib/constants"

/**
 * Multi-select chain picker. An empty selection means "All", so the default
 * state needs no special value and clearing always returns to showing
 * everything. Only chains passed in are offered — the caller derives those from
 * the collections actually loaded, so there are no options that lead to an
 * empty grid.
 */
export default function ChainFilter({
  options,
  selected,
  onChange,
}: {
  options: string[]
  selected: string[]
  onChange: (next: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onPointer)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onPointer)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const toggle = (chain: string) => {
    onChange(
      selected.includes(chain) ? selected.filter((c) => c !== chain) : [...selected, chain]
    )
  }

  const label =
    selected.length === 0
      ? `${ALL_CHAINS} chains`
      : selected.length === 1
        ? selected[0]
        : `${selected.length} chains`

  return (
    <div className="chainfilter" ref={root}>
      <button
        type="button"
        className={`chainfilter__button${selected.length ? " chainfilter__button--on" : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
      >
        {label}
        <svg width="10" height="10" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="chainfilter__menu" role="group" aria-label="Filter by chain">
          <button
            type="button"
            className="chainfilter__option"
            aria-pressed={selected.length === 0}
            onClick={() => onChange([])}
          >
            <span className="chainfilter__tick">{selected.length === 0 ? "✓" : ""}</span>
            {ALL_CHAINS} chains
          </button>
          {options.map((chain) => (
            <button
              key={chain}
              type="button"
              className="chainfilter__option"
              aria-pressed={selected.includes(chain)}
              onClick={() => toggle(chain)}
            >
              <span className="chainfilter__tick">{selected.includes(chain) ? "✓" : ""}</span>
              {chain}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
