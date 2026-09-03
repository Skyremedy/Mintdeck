/** Mint Deck is Arc-only — the chain is a constant, not a per-collection field. */
export const CHAIN = "Arc"

/** What a collection can be filed under. */
export const CATEGORIES = ["GameFi", "PFP", "Art"] as const

export type Category = (typeof CATEGORIES)[number]

/** Views over everything, not values a collection carries. */
export const TRENDING_TAB = "Trending"
export const JUST_IN_TAB = "Just In"

/** The tab strip. Five in total; the page lands on "Just In". */
export const TABS = [TRENDING_TAB, JUST_IN_TAB, ...CATEGORIES] as const
export const DEFAULT_TAB: string = JUST_IN_TAB

/** Arc settles in USDC, so that is the default unit for a priced mint. */
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
  { key: "mint", label: "Mint date" },
  { key: "tba", label: "TBA" },
] as const

export type SortKey = (typeof SORTS)[number]["key"]
export const DEFAULT_SORT: SortKey = "latest"
