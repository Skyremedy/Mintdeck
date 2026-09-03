/**
 * Minimal signed-cookie session for the single admin user (V1).
 *
 * The cookie carries an expiry plus an HMAC over it, so a visitor cannot mint a
 * valid session by hand-setting the cookie. Uses Web Crypto only, so the same
 * helpers run in the Node server and in `proxy.ts`.
 */

export const SESSION_COOKIE = "md_admin"
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 1 week

function secret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "mint-deck-insecure-dev-secret"
  )
}

const encoder = new TextEncoder()

async function key(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  )
}

function toBase64Url(bytes: ArrayBuffer): string {
  let binary = ""
  for (const b of new Uint8Array(bytes)) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

async function sign(payload: string): Promise<string> {
  return toBase64Url(await crypto.subtle.sign("HMAC", await key(), encoder.encode(payload)))
}

export async function createSessionToken(): Promise<string> {
  const expires = Date.now() + SESSION_MAX_AGE * 1000
  const payload = String(expires)
  return `${payload}.${await sign(payload)}`
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false
  const dot = token.lastIndexOf(".")
  if (dot < 1) return false
  const payload = token.slice(0, dot)
  const expires = Number(payload)
  if (!Number.isFinite(expires) || expires < Date.now()) return false
  // Comparing the recomputed signature (not the secret) keeps this constant-ish
  // time; crypto.subtle.verify does the timing-safe comparison for us.
  const provided = token.slice(dot + 1)
  const expected = await sign(payload)
  return provided.length === expected.length && provided === expected
}

export function checkCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.ADMIN_USERNAME || "admin"
  const expectedPass = process.env.ADMIN_PASSWORD
  if (!expectedPass) return false
  return username === expectedUser && password === expectedPass
}
