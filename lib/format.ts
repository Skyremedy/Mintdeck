import type { Collection } from "@prisma/client"
import { LOVE_WEIGHT, TRENDING_LIMIT } from "./constants"

/** Everything the tiles and tables need, safe to hand to a Client Component. */
export type CollectionView = {
  id: number
  name: string
  logo: string
  chain: string
  category: string
  /** ISO string, or null when the date is TBA. */
  mintAt: string | null
  timeTba: boolean
  supply: number | null
  priceType: string
  priceValue: number | null
  priceCurrency: string | null
  website: string | null
  twitter: string | null
  discord: string | null
  telegram: string | null
  opensea: string | null
  status: string
  clickCount: number
  loveCount: number
  pinnedPosition: number | null
  /** ISO string — drives the "Just In" view and the "Latest added" sort. */
  createdAt: string
}

export function toView(c: Collection & { _count?: { loves: number } }): CollectionView {
  return {
    id: c.id,
    name: c.name,
    logo: c.logo,
    chain: c.chain,
    category: c.category,
    mintAt: c.mintAt ? c.mintAt.toISOString() : null,
    timeTba: c.timeTba,
    supply: c.supply,
    priceType: c.priceType,
    priceValue: c.priceValue,
    priceCurrency: c.priceCurrency,
    website: c.website,
    twitter: c.twitter,
    discord: c.discord,
    telegram: c.telegram,
    opensea: c.opensea,
    status: c.status,
    clickCount: c.clickCount,
    loveCount: c._count?.loves ?? 0,
    pinnedPosition: c.pinnedPosition,
    createdAt: c.createdAt.toISOString(),
  }
}

/**
 * "01/10" — day/month in numbers. The two-digit year is appended only when the
 * mint is not in the current year, so a far-off date is never ambiguous.
 */
export function formatMintDate(iso: string | null): string {
  if (!iso) return "TBA"

  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  const day = pad(d.getUTCDate())
  const month = pad(d.getUTCMonth() + 1)

  const sameYear = d.getUTCFullYear() === new Date().getUTCFullYear()
  return sameYear ? `${day}/${month}` : `${day}/${month}/${pad(d.getUTCFullYear() % 100)}`
}

export function formatMintTime(iso: string | null, timeTba: boolean): string {
  if (!iso) return "Time TBA"
  if (timeTba) return "Time TBA"
  const d = new Date(iso)
  return (
    d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "UTC",
    }) + " UTC"
  )
}

/** "Free", "TBA" or "0.08 ETH" — trailing zeros trimmed. */
export function formatPrice(c: Pick<CollectionView, "priceType" | "priceValue" | "priceCurrency">): string {
  if (c.priceType === "Free") return "Free"
  if (c.priceType === "TBA" || c.priceValue == null) return "TBA"
  const n = c.priceValue
  const digits = n >= 100 ? 0 : n >= 1 ? 2 : 4
  const amount = n
    .toFixed(digits)
    .replace(/\.?0+$/, "")
  return c.priceCurrency ? `${amount} ${c.priceCurrency}` : amount
}

/** "10,000" — or "TBA" when the supply has not been announced. */
export function formatSupply(supply: number | null): string {
  return supply == null ? "TBA" : supply.toLocaleString("en-US")
}

/** The instant a mint stops being "upcoming". Day-end when only the day is known. */
export function mintEndsAt(iso: string | null, timeTba: boolean): Date | null {
  if (!iso) return null
  const d = new Date(iso)
  if (!timeTba) return d
  const end = new Date(d)
  end.setUTCHours(23, 59, 59, 999)
  return end
}

/** "3d 4h" / "12h 30m" / "Live" — null when the date is TBA. */
export function formatCountdown(iso: string | null, timeTba: boolean, now = Date.now()): string | null {
  const end = mintEndsAt(iso, timeTba)
  if (!end) return null
  const ms = end.getTime() - now
  if (ms <= 0) return "Live"
  const mins = Math.floor(ms / 60000)
  const days = Math.floor(mins / 1440)
  const hours = Math.floor((mins % 1440) / 60)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins % 60}m`
  return `${mins}m`
}

/** Newest listing first. */
export function byLatestAdded(a: CollectionView, b: CollectionView): number {
  const diff = Date.parse(b.createdAt) - Date.parse(a.createdAt)
  return diff !== 0 ? diff : b.id - a.id
}

/** Soonest mint first, with undated (TBA) collections after the dated ones. */
export function byMintDate(a: CollectionView, b: CollectionView): number {
  const ea = mintEndsAt(a.mintAt, a.timeTba)?.getTime() ?? Infinity
  const eb = mintEndsAt(b.mintAt, b.timeTba)?.getTime() ?? Infinity
  if (ea !== eb) return ea - eb
  return byLatestAdded(a, b)
}

/** A collection with no confirmed mint date. */
export function isTba(c: CollectionView): boolean {
  return c.mintAt === null
}

/** What Trending ranks on: clicks plus loves, with loves weighted up. */
export function trendingScore(c: { clickCount: number; loveCount: number }): number {
  return c.clickCount + c.loveCount * LOVE_WEIGHT
}

/**
 * Trending order: pinned collections hold their 1-based slot, every other slot
 * is filled by the next-highest scoring collection. Duplicate or out-of-range
 * pins cascade to the next free slot instead of dropping a collection.
 *
 * Only the first `limit` make it out — a pin beyond that is simply off the end
 * of the list, the same as it would be for the public page.
 */
export function orderTrending<
  T extends { pinnedPosition: number | null; clickCount: number; loveCount: number; id: number },
>(items: T[], limit: number = TRENDING_LIMIT): T[] {
  const pinned = items
    .filter((i) => i.pinnedPosition != null)
    .sort((a, b) => a.pinnedPosition! - b.pinnedPosition! || a.id - b.id)
  const auto = items
    .filter((i) => i.pinnedPosition == null)
    .sort((a, b) => trendingScore(b) - trendingScore(a) || a.id - b.id)

  const slots = new Map<number, T>()
  for (const p of pinned) {
    let pos = Math.max(1, p.pinnedPosition!)
    while (slots.has(pos)) pos++
    slots.set(pos, p)
  }

  const highestPin = slots.size ? Math.max(...slots.keys()) : 0
  const length = Math.max(items.length, highestPin)
  const out: T[] = []
  let next = 0
  for (let pos = 1; pos <= length; pos++) {
    const p = slots.get(pos)
    if (p) out.push(p)
    else if (next < auto.length) out.push(auto[next++])
    if (out.length >= limit) break
  }
  return out
}
