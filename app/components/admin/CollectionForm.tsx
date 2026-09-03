"use client"

import { useActionState, useEffect, useState } from "react"
import Link from "next/link"
import { CATEGORIES, CURRENCIES, DEFAULT_CURRENCY, PRICE_TYPES } from "../../../lib/constants"
import type { CollectionView } from "../../../lib/format"
import type { ActionState } from "../../../lib/admin-actions"
import { extractXHandle } from "../../../lib/x"

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>

/** Only preview a src the browser can actually load — a half-typed URL would
 *  otherwise fire a request (and a 404) on every keystroke. */
function previewable(value: string): string | null {
  if (value.startsWith("blob:") || value.startsWith("/")) return value
  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:" ? value : null
  } catch {
    return null
  }
}

function splitMintAt(iso: string | null) {
  if (!iso) return { date: "", time: "" }
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return {
    date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
    time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`,
  }
}

export default function CollectionForm({
  action,
  collection,
  submissionId,
  submitLabel,
}: {
  action: Action
  collection?: CollectionView
  submissionId?: number
  submitLabel: string
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {})

  const initial = splitMintAt(collection?.mintAt ?? null)
  const [dateTba, setDateTba] = useState(collection ? collection.mintAt === null : false)
  const [priceType, setPriceType] = useState(collection?.priceType ?? "TBA")
  const [category, setCategory] = useState<string>(collection?.category ?? CATEGORIES[0])
  const [logoUrl, setLogoUrl] = useState(
    collection && !collection.logo.startsWith("/uploads/") ? collection.logo : ""
  )
  const [preview, setPreview] = useState<string | null>(
    collection ? previewable(collection.logo) : null
  )
  const [twitter, setTwitter] = useState(collection?.twitter ?? "")

  // Debounced, because every keystroke spells a *different* valid handle:
  // typing "skyremedy" would otherwise look up @s, @sk, @sky… and each miss
  // costs one request against the avatar resolver's small daily quota.
  const [settledTwitter, setSettledTwitter] = useState(twitter)
  useEffect(() => {
    const id = setTimeout(() => setSettledTwitter(twitter), 600)
    return () => clearTimeout(id)
  }, [twitter])

  // With no logo of its own, a tile falls back to the X profile picture. Show
  // that here so the admin sees the real logo before saving, not after.
  const xHandle = extractXHandle(settledTwitter)
  // Goes through /api/x-avatar so a handle is fetched from the resolver once,
  // ever — retyping or revisiting the form is served from the local cache.
  const effectivePreview = preview ?? (xHandle ? `/api/x-avatar/${xHandle}` : null)

  return (
    <form action={formAction} className="panel">
      <div className="panel__body form-grid">
        {collection && <input type="hidden" name="id" value={collection.id} />}
        {submissionId && <input type="hidden" name="submissionId" value={submissionId} />}

        {state.error && (
          <div className="form-row--full alert" role="alert">
            {state.error}
          </div>
        )}

        <div className="form-row">
          <label htmlFor="name">Collection name</label>
          <input
            id="name"
            name="name"
            className="field"
            defaultValue={collection?.name ?? ""}
            placeholder="Mint Deck Genesis"
            required
            maxLength={80}
          />
        </div>

        <div className="form-row">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            className="field"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label htmlFor="logoFile">Logo upload</label>
          <input
            id="logoFile"
            name="logoFile"
            type="file"
            className="field"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            onChange={(e) => {
              const file = e.target.files?.[0]
              setPreview(
                file
                  ? URL.createObjectURL(file)
                  : previewable(logoUrl || collection?.logo || "")
              )
            }}
          />
          <span className="hint">PNG, JPEG, WEBP, GIF or SVG, up to 2 MB.</span>
        </div>

        <div className="form-row">
          <label htmlFor="logoUrl">…or paste an image URL</label>
          <input
            id="logoUrl"
            name="logoUrl"
            className="field"
            value={logoUrl}
            placeholder="https://…/logo.png"
            onChange={(e) => {
              setLogoUrl(e.target.value)
              setPreview(previewable(e.target.value || collection?.logo || ""))
            }}
          />
          {effectivePreview ? (
            <span style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 4 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={effectivePreview} alt="" className="logo" />
              {!preview && xHandle && (
                <span className="hint">Using @{xHandle}&apos;s X profile picture</span>
              )}
            </span>
          ) : (
            <span className="hint">
              Leave both empty to use the X profile picture from the handle below.
            </span>
          )}
        </div>

        <div className="form-row form-row--full">
          <label className="check">
            <input
              type="checkbox"
              name="dateTba"
              checked={dateTba}
              onChange={(e) => setDateTba(e.target.checked)}
            />
            Mint date is TBA — keep it on the homepage with no confirmed date
          </label>
        </div>

        {!dateTba && (
          <>
            <div className="form-row">
              <label htmlFor="mintDate">Mint date (UTC)</label>
              <input
                id="mintDate"
                name="mintDate"
                type="date"
                className="field"
                defaultValue={initial.date}
              />
            </div>
            <div className="form-row">
              <label htmlFor="mintTime">Mint time (UTC)</label>
              <input
                id="mintTime"
                name="mintTime"
                type="time"
                className="field"
                defaultValue={collection?.timeTba ? "" : initial.time}
              />
              <span className="hint">Leave empty to show “Time TBA”.</span>
            </div>
          </>
        )}

        <div className="form-row">
          <label htmlFor="supply">Supply</label>
          <input
            id="supply"
            name="supply"
            type="number"
            min="1"
            step="1"
            className="field"
            defaultValue={collection?.supply ?? ""}
            placeholder="10000 — leave empty for TBA"
          />
        </div>

        <div className="form-row">
          <label htmlFor="priceType">Mint price</label>
          <select
            id="priceType"
            name="priceType"
            className="field"
            value={priceType}
            onChange={(e) => setPriceType(e.target.value)}
          >
            {PRICE_TYPES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {priceType === "Price" && (
          <div className="form-row">
            <label htmlFor="priceValue">Amount</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                id="priceValue"
                name="priceValue"
                type="number"
                step="any"
                min="0"
                className="field"
                defaultValue={collection?.priceValue ?? ""}
                placeholder="0.08"
              />
              <select
                name="priceCurrency"
                className="field"
                style={{ width: 110 }}
                defaultValue={collection?.priceCurrency ?? DEFAULT_CURRENCY}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="form-row">
          <label htmlFor="website">Website</label>
          <input
            id="website"
            name="website"
            className="field"
            defaultValue={collection?.website ?? ""}
            placeholder="https://collection.xyz"
          />
        </div>

        <div className="form-row">
          <label htmlFor="twitter">X (Twitter) handle or URL</label>
          <input
            id="twitter"
            name="twitter"
            className="field"
            value={twitter}
            placeholder="@collection"
            onChange={(e) => setTwitter(e.target.value)}
          />
        </div>

        {(
          [
            ["discord", "Discord URL", "https://discord.gg/…"],
            ["telegram", "Telegram URL", "https://t.me/…"],
            ["opensea", "OpenSea URL", "https://opensea.io/collection/…"],
          ] as const
        ).map(([key, label, placeholder]) => (
          <div className="form-row" key={key}>
            <label htmlFor={key}>{label}</label>
            <input
              id={key}
              name={key}
              className="field"
              defaultValue={collection?.[key] ?? ""}
              placeholder={placeholder}
            />
          </div>
        ))}

        <div className="form-row">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            className="field"
            defaultValue={collection?.status ?? "Upcoming"}
          >
            <option value="Upcoming">Upcoming — live on the homepage</option>
            <option value="Past">Past — archived</option>
          </select>
        </div>

        <div className="form-row">
          <label htmlFor="pinnedPosition">Pin to trending position</label>
          <input
            id="pinnedPosition"
            name="pinnedPosition"
            type="number"
            min="1"
            className="field"
            defaultValue={collection?.pinnedPosition ?? ""}
            placeholder="Leave empty for automatic ranking"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn--accent" disabled={pending}>
            {pending ? "Saving…" : submitLabel}
          </button>
          <Link href="/admin/collections" className="btn btn--ghost">
            Cancel
          </Link>
        </div>
      </div>
    </form>
  )
}
