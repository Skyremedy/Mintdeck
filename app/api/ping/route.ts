import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import prisma from "../../../lib/db"
import { resolveVisitorId, setVisitorCookie } from "../../../lib/visitor"

/**
 * Heartbeat used for the admin's visitor counts. One row per browser; the
 * homepage pings on load and every couple of minutes so "Online now" can be a
 * simple `lastSeen` window.
 */
export async function POST(request: NextRequest) {
  const { id, isNew } = resolveVisitorId(request)

  await prisma.visitor.upsert({
    where: { id },
    create: { id },
    update: { lastSeen: new Date() },
  })

  const response = NextResponse.json({ ok: true })
  if (isNew) setVisitorCookie(response, id)
  return response
}
