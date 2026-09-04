/** Chains a collection can mint on. Separate from CATEGORIES, which is what
 *  kind of collection it is. */
export const CHAINS = [
  "Ethereum",
  "Solana",
  "Base",
  "Arc",
  "Hyperliquid",
  "Robinhood",
  "Bitcoin",
  "Abstract",
  "Berachain",
  "Monad",
  "Polygon",
  "ApeChain",
  "Ronin",
  "Blast",
] as const

export type Chain = (typeof CHAINS)[number]

export const DEFAULT_CHAIN: string = "Arc"

/** Sentinel for "no chain filter" in the public chain picker. */
export const ALL_CHAINS = "All"

/**
 * What a collection can be filed under. "Others" is the catch-all for projects
 * that have not said enough about themselves to place yet.
 */
export const CATEGORIES = ["GameFi", "PFP", "Art", "Utility", "Others"] as const

export type Category = (typeof CATEGORIES)[number]

/** Views over everything, not values a collection carries. */
export const TRENDING_TAB = "Trending"
export const JUST_IN_TAB = "Just In"

/** The tab strip: the two views plus every category. Lands on "Just In". */
export const TABS = [TRENDING_TAB, JUST_IN_TAB, ...CATEGORIES] as const
export const DEFAULT_TAB: string = JUST_IN_TAB

/** Default unit for a priced mint; every currency below stays selectable. */
export const DEFAULT_CURRENCY = "USDC"
export const CURRENCIES = ["USDC", "USD", "ETH", "BTC"] as const

export const PRICE_TYPES = ["Free", "TBA", "Price"] as const
export type PriceType = (typeof PRICE_TYPES)[number]

/**
 * The sort row under the tabs. "latest" and "mint" order the same set; "tba"
 * also narrows it to collections with no confirmed date.
 */
export const SORTS = [
  { key: "latest", label: "Latest added" },
  { key: "mint", label: "Minting soon" },
  { key: "tba", label: "TBA" },
] as const

export type SortKey = (typeof SORTS)[number]["key"]
export const DEFAULT_SORT: SortKey = "latest"

/**
 * Trending ranks on clicks *and* loves. Loves are far rarer than clicks — a
 * love is deliberate where a click is casual — so an unweighted sum would let
 * clicks drown them out entirely. This is the dial that decides how much a love
 * is worth; tune it once there is real traffic to judge by.
 */
export const LOVE_WEIGHT = 20

/** Trending shows only this many collections. */
export const TRENDING_LIMIT = 15

/**
 * Offsets added to the visitor counters shown in the public header.
 *
 * These are presentation padding, not measurement: the figures visitors see are
 * the real counts plus these numbers. The admin dashboard deliberately shows
 * the unpadded values, so internal reporting stays honest. Set both to 0 to
 * show real traffic.
 */
export const PUBLIC_VISITOR_OFFSET = 5889
export const PUBLIC_ONLINE_OFFSET = 9
