import "server-only"

import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

import prisma from "./db"

/**
 * Persistent memory for X profile pictures.
 *
 * Two resolvers, tried in order:
 *
 *   1. X's own API, when `X_BEARER_TOKEN` is set. Authoritative and exact.
 *   2. unavatar.io, which needs no key but allows only 25 anonymous requests
 *      per day per IP.
 *
 * Every result is recorded in the `XAvatar` table:
 *
 *   - a hit writes the image to disk once and is served locally forever after;
 *   - a miss is remembered too, so a handle with no avatar cannot re-spend the
 *     daily quota on every page view;
 *   - a rate-limit is remembered for a short cooldown, so a page full of
 *     avatars does not retry every one of them on every render.
 *
 * The upshot is that a handle costs at most one upstream request for the life
 * of the app, and the browser never talks to the resolver directly.
 */

const CACHE_DIR = path.join(process.cwd(), "public", "uploads", "x")
const CACHE_URL_PREFIX = "/uploads/x"

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
}

const MAX_BYTES = 2 * 1024 * 1024

/** How long a "this handle has no avatar" result is trusted before retrying. */
const MISS_TTL_MS = 7 * 24 * 60 * 60 * 1000

/**
 * How long to stop asking after the resolver rate-limits us. Without this, a
 * page that shows several avatars retries every one on every render and spends
 * the daily quota trying to discover it is already spent.
 */
const RATE_LIMIT_COOLDOWN_MS = 15 * 60 * 1000

export type AvatarResult =
  | { ok: true; publicPath: string; cached: boolean }
  | { ok: false; reason: "rate-limited" | "not-found" | "unavailable" }

export type AvatarFailure = Extract<AvatarResult, { ok: false }>["reason"]

/** X handles are case-insensitive, so the memory is keyed in lower case. */
function key(handle: string): string {
  return handle.toLowerCase()
}

type Fetched = { bytes: ArrayBuffer; mime: string }
type ResolveOutcome =
  | { kind: "image"; value: Fetched }
  | { kind: "miss" }
  | { kind: "transient"; reason: "rate-limited" | "unavailable" }

async function download(url: string, headers?: HeadersInit): Promise<ResolveOutcome> {
  let res: Response
  try {
    res = await fetch(url, { cache: "no-store", headers, signal: AbortSignal.timeout(8000) })
  } catch {
    return { kind: "transient", reason: "unavailable" }
  }
  if (res.status === 429) return { kind: "transient", reason: "rate-limited" }
  if (!res.ok) return { kind: "miss" }

  const mime = (res.headers.get("content-type") ?? "").split(";")[0].trim()
  if (!EXT_BY_MIME[mime]) return { kind: "miss" }

  const bytes = await res.arrayBuffer()
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) return { kind: "miss" }
  return { kind: "image", value: { bytes, mime } }
}

/**
 * X API v2 user lookup. Needs only an App-only Bearer Token — the consumer
 * key/secret are what mint that token, and are never sent here.
 */
async function resolveViaXApi(handle: string): Promise<ResolveOutcome | null> {
  const token = process.env.X_BEARER_TOKEN?.trim()
  if (!token) return null

  let res: Response
  try {
    res = await fetch(
      `https://api.x.com/2/users/by/username/${encodeURIComponent(handle)}?user.fields=profile_image_url`,
      {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(8000),
      }
    )
  } catch {
    return { kind: "transient", reason: "unavailable" }
  }

  if (res.status === 429) return { kind: "transient", reason: "rate-limited" }
  if (res.status === 401 || res.status === 403) {
    // Bad token, or a plan whose access level excludes user lookup. Transient
    // from the cache's point of view: it must not be remembered as "no avatar".
    console.warn(
      `[x-avatar] X API returned ${res.status} for @${handle}. Check X_BEARER_TOKEN and that your X API plan includes GET /2/users/by/username.`
    )
    return { kind: "transient", reason: "unavailable" }
  }
  if (!res.ok) return { kind: "miss" }

  const body = (await res.json().catch(() => null)) as
    | { data?: { profile_image_url?: string } }
    | null
  const url = body?.data?.profile_image_url
  if (!url) return { kind: "miss" }

  // X returns the 48px "_normal" variant; _400x400 is the same image, larger.
  return download(url.replace(/_normal(\.[a-z]+)$/i, "_400x400$1"))
}

async function resolveViaUnavatar(handle: string): Promise<ResolveOutcome> {
  const apiKey = process.env.UNAVATAR_API_KEY?.trim()
  return download(
    `https://unavatar.io/x/${encodeURIComponent(handle)}?fallback=false`,
    // unavatar takes the key as an `x-api-key` header, not a query parameter.
    apiKey ? { "x-api-key": apiKey } : undefined
  )
}

/**
 * Returns a locally-served path for the handle's avatar, fetching it at most
 * once. Never throws — the caller decides what a miss means.
 */
export async function getXAvatar(handle: string): Promise<AvatarResult> {
  const handleKey = key(handle)

  const remembered = await prisma.xAvatar.findUnique({ where: { handle: handleKey } })
  if (remembered?.status === "ok" && remembered.path) {
    return { ok: true, publicPath: remembered.path, cached: true }
  }
  const age = remembered ? Date.now() - remembered.fetchedAt.getTime() : Infinity
  if (remembered?.status === "missing" && age < MISS_TTL_MS) {
    return { ok: false, reason: "not-found" }
  }
  if (remembered?.status === "ratelimited" && age < RATE_LIMIT_COOLDOWN_MS) {
    return { ok: false, reason: "rate-limited" }
  }

  // X API first when configured, unavatar as the fallback.
  const primary = await resolveViaXApi(handle)
  let outcome: ResolveOutcome

  if (primary?.kind === "image") {
    outcome = primary
  } else {
    const fallback = await resolveViaUnavatar(handle)
    if (fallback.kind === "image") {
      outcome = fallback
    } else if (primary?.kind === "transient") {
      // Neither returned an image, but the primary failed for a reason that may
      // clear up. Prefer that over recording a permanent miss.
      outcome = primary
    } else {
      outcome = fallback
    }
  }

  if (outcome.kind === "transient") {
    // Remember a rate-limit briefly so a burst of views costs one request, not
    // one per view. A network blip is not recorded — it usually clears at once.
    if (outcome.reason === "rate-limited") await rememberRateLimit(handleKey)
    return { ok: false, reason: outcome.reason }
  }

  if (outcome.kind === "miss") {
    await rememberMiss(handleKey)
    return { ok: false, reason: "not-found" }
  }

  const { bytes, mime } = outcome.value
  const filename = `${handleKey}.${EXT_BY_MIME[mime]}`
  await mkdir(CACHE_DIR, { recursive: true })
  await writeFile(path.join(CACHE_DIR, filename), Buffer.from(bytes))

  const publicPath = `${CACHE_URL_PREFIX}/${filename}`
  await prisma.xAvatar.upsert({
    where: { handle: handleKey },
    create: { handle: handleKey, status: "ok", path: publicPath },
    update: { status: "ok", path: publicPath, fetchedAt: new Date() },
  })

  return { ok: true, publicPath, cached: false }
}

async function rememberRateLimit(handleKey: string): Promise<void> {
  await prisma.xAvatar.upsert({
    where: { handle: handleKey },
    create: { handle: handleKey, status: "ratelimited" },
    update: { status: "ratelimited", path: null, fetchedAt: new Date() },
  })
}

async function rememberMiss(handleKey: string): Promise<void> {
  await prisma.xAvatar.upsert({
    where: { handle: handleKey },
    create: { handle: handleKey, status: "missing" },
    update: { status: "missing", path: null, fetchedAt: new Date() },
  })
}

/** Human-readable reason, used in admin form errors. */
export function avatarFailureMessage(handle: string, reason: AvatarFailure): string {
  switch (reason) {
    case "rate-limited":
      return `The avatar service is rate-limited right now, so @${handle}'s picture could not be fetched. Upload a logo or paste an image URL, or set UNAVATAR_API_KEY and try again.`
    case "not-found":
      return `No profile picture found for @${handle}. Upload a logo or paste an image URL instead.`
    default:
      return `Could not reach the avatar service for @${handle}. Upload a logo or paste an image URL instead.`
  }
}
