"use client"

import { useEffect, useRef, useState } from "react"
import { recordClick } from "../../lib/actions"
import {
  formatCountdown,
  formatMintDate,
  formatMintTime,
  formatPrice,
  formatSupply,
  type CollectionView,
} from "../../lib/format"
import Logo from "./Logo"
import { useLove } from "./LoveProvider"
import { ClockIcon, DiscordIcon, GlobeIcon, OpenSeaIcon, PinIcon, TelegramIcon, XIcon } from "./icons"

/** Where a tile click sends you: the collection's own site when it has one. */
function primaryLink(c: CollectionView): string | null {
  return c.website ?? c.twitter ?? c.opensea ?? c.discord ?? c.telegram ?? null
}

function Countdown({ collection, href }: { collection: CollectionView; href: string | null }) {
  // Rendered only after mount: a relative time computed on the server would
  // disagree with the client and trip a hydration mismatch.
  const [label, setLabel] = useState<string | null>(null)

  useEffect(() => {
    const tick = () => setLabel(formatCountdown(collection.mintAt, collection.timeTba))
    tick()
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [collection.mintAt, collection.timeTba])

  if (!label) return null

  const exactTime = formatMintTime(collection.mintAt, collection.timeTba)

  return (
    <span
      className={`chip chip--tip ${label === "Live" ? "chip--soon" : ""}`}
      data-tip={exactTime}
      // The tile's stretched link sits above static content, so the chip needs
      // to opt back in to hover — and then forward clicks itself, rather than
      // leaving a patch of the card that does nothing.
      onClick={() => {
        if (href) window.open(href, "_blank", "noopener,noreferrer")
      }}
    >
      {label === "Live" ? <span className="dot dot--pulse" /> : <ClockIcon />}
      {label === "Live" ? "Minting" : label}
      <span className="sr-only">— mints at {exactTime}</span>
    </span>
  )
}

const SOCIALS = [
  { key: "website", label: "the web", Icon: GlobeIcon },
  { key: "twitter", label: "X", Icon: XIcon },
  { key: "discord", label: "Discord", Icon: DiscordIcon },
  { key: "telegram", label: "Telegram", Icon: TelegramIcon },
  { key: "opensea", label: "OpenSea", Icon: OpenSeaIcon },
] as const

export default function CollectionTile({
  collection,
  rank,
}: {
  collection: CollectionView
  rank?: number
}) {
  const { count: loveCount, loved, toggle } = useLove(collection.id)
  const [burst, setBurst] = useState(false)
  const counted = useRef(false)
  const href = primaryLink(collection)
  const price = formatPrice(collection)
  const priceModifier =
    collection.priceType === "Free"
      ? " stat__value--free"
      : price === "TBA"
        ? " stat__value--tba"
        : ""

  // One count per tile per page view keeps the trending signal from being
  // inflated by someone clicking the same card repeatedly.
  const handleClick = () => {
    if (counted.current) return
    counted.current = true
    void recordClick(collection.id)
  }

  const showRank = typeof rank === "number" && rank <= 3
  const pinned = collection.pinnedPosition != null

  return (
    <article
      className={`tile${showRank || pinned ? " tile--ranked" : ""}`}
      onClick={handleClick}
    >
      {pinned ? (
        <span className="chip chip--rank chip--accent" title={`Pinned to #${collection.pinnedPosition}`}>
          <PinIcon />
          {rank ?? collection.pinnedPosition}
        </span>
      ) : showRank ? (
        <span className="chip chip--rank">#{rank}</span>
      ) : null}

      <div className="tile__head">
        <Logo src={collection.logo} name={collection.name} />
        <div className="tile__identity">
          <h3 className="tile__name">
            {href ? (
              <a
                className="tile__link"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {collection.name}
              </a>
            ) : (
              collection.name
            )}
          </h3>
          <div className="tile__meta">
            <span className="chip">{collection.category}</span>
            <Countdown collection={collection} href={href} />
          </div>
        </div>
      </div>

      {/* One grid, not three stacked blocks, so the labels share a line and the
          values share a baseline. The exact mint time lives on the countdown
          chip's tooltip rather than taking a row here. */}
      <div className="tile__stats">
        <div className="stat stat--mint">
          <span className="stat__label">Mint</span>
          <span className="stat__value">{formatMintDate(collection.mintAt)}</span>
        </div>

        <div className="stat stat--supply">
          <span className="stat__label">Supply</span>
          <span className="stat__value stat__value--muted">
            {formatSupply(collection.supply)}
          </span>
        </div>

        <div className="stat stat--price">
          <span className="stat__label">Price</span>
          <span className={`stat__value${priceModifier}`}>{price}</span>
        </div>
      </div>

      <div className="tile__socials">
        {SOCIALS.map(({ key, label, Icon }) => {
          const url = collection[key]
          if (!url) {
            return (
              <span key={key} className="social social--empty" aria-hidden="true">
                <Icon />
              </span>
            )
          }
          return (
            <a
              key={key}
              className="social"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              title={
                key === "website"
                  ? `Visit ${collection.name}`
                  : `${collection.name} on ${label}`
              }
              aria-label={
                key === "website"
                  ? `Visit the ${collection.name} website`
                  : `${collection.name} on ${label}`
              }
            >
              <Icon />
            </a>
          )
        })}

        <button
          type="button"
          className={`love${loved ? " love--on" : ""}${burst ? " love--burst" : ""}`}
          aria-pressed={loved}
          title={loved ? `You love ${collection.name} — click to undo` : `Love ${collection.name}`}
          onClick={(e) => {
            // The tile itself is a link; loving must not follow it.
            e.preventDefault()
            e.stopPropagation()
            if (!loved) {
              setBurst(true)
              setTimeout(() => setBurst(false), 450)
            }
            toggle()
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 20.7 3.9 12.6a5.2 5.2 0 0 1 7.35-7.35l.75.75.75-.75a5.2 5.2 0 0 1 7.35 7.35Z"
              fill={loved ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinejoin="round"
            />
          </svg>
          <span className="num">{loveCount}</span>
          <span className="sr-only">
            {loved ? `You love ${collection.name}. Click to undo.` : `Love ${collection.name}`}
          </span>
        </button>
      </div>
    </article>
  )
}
