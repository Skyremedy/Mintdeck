"use client"

import { useMemo, useState } from "react"
import {
  DEFAULT_SORT,
  DEFAULT_TAB,
  JUST_IN_TAB,
  SORTS,
  TABS,
  TRENDING_TAB,
  type SortKey,
} from "../../lib/constants"
import {
  byLatestAdded,
  byMintDate,
  isTba,
  orderTrending,
  type CollectionView,
} from "../../lib/format"
import CollectionTile from "./CollectionTile"
import LoveProvider from "./LoveProvider"
import SubmissionBox from "./SubmissionBox"
import VisitorStats from "./VisitorStats"
import type { PublicVisitorStats } from "../../lib/queries"

export default function HomeClient({
  collections,
  stats,
}: {
  collections: CollectionView[]
  stats: PublicVisitorStats
}) {
  const [tab, setTab] = useState<string>(DEFAULT_TAB)
  const [sort, setSort] = useState<SortKey>(DEFAULT_SORT)

  const counts = useMemo(() => {
    const map = new Map<string, number>([
      [TRENDING_TAB, collections.length],
      [JUST_IN_TAB, collections.length],
    ])
    for (const c of collections) map.set(c.category, (map.get(c.category) ?? 0) + 1)
    return map
  }, [collections])

  // Trending defines its own order, so the sort row would contradict it.
  const showSort = tab !== TRENDING_TAB

  const visible = useMemo(() => {
    if (tab === TRENDING_TAB) return orderTrending(collections)

    const inTab = tab === JUST_IN_TAB ? collections : collections.filter((c) => c.category === tab)

    // "TBA" narrows as well as orders — only undated mints, newest listing first.
    if (sort === "tba") return inTab.filter(isTba).sort(byLatestAdded)
    if (sort === "mint") return [...inTab].sort(byMintDate)
    return [...inTab].sort(byLatestAdded)
  }, [collections, tab, sort])

  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <h1 className="page-title">Upcoming Arc mints</h1>
          <p className="page-sub">
            Every confirmed and TBA drop on Arc, newest listing first. Mints move to the archive
            the moment their window closes.
          </p>
        </div>
        <VisitorStats initial={stats} />
      </div>

      <div className="tabs" role="tablist" aria-label="Categories">
        {TABS.map((name) => {
          const count = counts.get(name) ?? 0
          return (
            <button
              key={name}
              type="button"
              role="tab"
              className="tab"
              aria-selected={tab === name}
              onClick={() => setTab(name)}
            >
              {name}
              {count > 0 && <span className="tab__count">{count}</span>}
            </button>
          )
        })}
      </div>

      {showSort && (
        <div className="sortbar">
          <span className="sortbar__label">Sort</span>
          <div className="segmented" role="group" aria-label="Sort collections">
            {SORTS.map((option) => (
              <button
                key={option.key}
                type="button"
                className="segment"
                aria-pressed={sort === option.key}
                onClick={() => setSort(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {visible.length > 0 ? (
        <LoveProvider seed={collections.map((c) => ({ id: c.id, loveCount: c.loveCount }))}>
          <div className="grid">
            {visible.map((c, i) => (
              <CollectionTile
                key={c.id}
                collection={c}
                rank={tab === TRENDING_TAB ? i + 1 : undefined}
              />
            ))}
          </div>
        </LoveProvider>
      ) : (
        <div className="empty">
          <p className="empty__title">Nothing here yet</p>
          <p>
            {sort === "tba"
              ? "No collections are waiting on a date right now."
              : tab === TRENDING_TAB || tab === JUST_IN_TAB
                ? "New Arc mints show up as soon as they're added."
                : `No upcoming ${tab} mints right now — try another category.`}
          </p>
        </div>
      )}

      <SubmissionBox />
    </>
  )
}
