import "server-only"

import type { NextRequest, NextResponse } from "next/server"

/** Anonymous per-browser id, shared by the visitor heartbeat and the love button. */
export const VISITOR_COOKIE = "md_vid"
const MAX_AGE = 60 * 60 * 24 * 365

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

export function readVisitorId(request: NextRequest): string | null {
  const value = request.cookies.get(VISITOR_COOKIE)?.value
  return value && UUID.test(value) ? value : null
}

/** Returns the existing id, or a fresh one that the caller must persist. */
export function resolveVisitorId(request: NextRequest): { id: string; isNew: boolean } {
  const existing = readVisitorId(request)
  return existing ? { id: existing, isNew: false } : { id: crypto.randomUUID(), isNew: true }
}

export function setVisitorCookie(response: NextResponse, id: string): void {
  response.cookies.set(VISITOR_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/",
  })
}
