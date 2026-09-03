/**
 * X (Twitter) handle helpers.
 *
 * X's own API needs a paid key, so profile pictures are resolved through
 * unavatar.io, which redirects a handle to that account's avatar. Anything the
 * admin saves is copied into /public/uploads so a tile never depends on a
 * third-party service staying up.
 */

const X_HOSTS = new Set(["x.com", "www.x.com", "twitter.com", "www.twitter.com", "mobile.twitter.com"])

/** Accepts "@name", "name", or any x.com/twitter.com profile URL. */
export function extractXHandle(input: string | null | undefined): string | null {
  const raw = (input ?? "").trim()
  if (!raw) return null

  let candidate = raw
  if (/^(https?:)?\/\//i.test(raw) || /^[\w.-]+\.(com|co)\//i.test(raw)) {
    try {
      const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
      if (!X_HOSTS.has(url.hostname.toLowerCase())) return null
      candidate = url.pathname.split("/").filter(Boolean)[0] ?? ""
    } catch {
      return null
    }
  }

  candidate = candidate.replace(/^@+/, "").split(/[/?#]/)[0]
  return /^[A-Za-z0-9_]{1,15}$/.test(candidate) ? candidate : null
}

export function xProfileUrl(handle: string): string {
  return `https://x.com/${handle}`
}

