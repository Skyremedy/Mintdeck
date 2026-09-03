"use client"

import { useState } from "react"

const PERIODS = [
  { key: "today", label: "Today" },
  { key: "week", label: "7d" },
  { key: "month", label: "30d" },
  { key: "allTime", label: "All" },
] as const

type PeriodKey = (typeof PERIODS)[number]["key"]

export default function VisitorStats({ visitors }: { visitors: Record<PeriodKey, number> }) {
  const [period, setPeriod] = useState<PeriodKey>("allTime")

  return (
    <div className="stat-card">
      <div className="stat-card__label">
        Visitors
        <span role="tablist" aria-label="Visitor period" style={{ marginLeft: "auto", display: "inline-flex", gap: 2 }}>
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              role="tab"
              onClick={() => setPeriod(p.key)}
              className="tab"
              style={{ height: 22, padding: "0 8px", fontSize: 11 }}
              aria-selected={period === p.key}
            >
              {p.label}
            </button>
          ))}
        </span>
      </div>
      <div className="stat-card__value">{visitors[period].toLocaleString()}</div>
      <div className="stat-card__hint">
        Unique browsers seen {period === "allTime" ? "all time" : `in the last ${PERIODS.find((p) => p.key === period)!.label}`}
      </div>
    </div>
  )
}
