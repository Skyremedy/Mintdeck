import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import prisma from "../../../lib/db"
import { readVisitorId, resolveVisitorId, setVisitorCookie } from "../../../lib/visitor"

/** Which collections this browser has loved. Counts are server-rendered with
 *  the tiles, so the client only needs its own set. */
export async function GET(request: NextRequest) {
  const visitorId = readVisitorId(request)
  if (!visitorId) return NextResponse.json({ loved: [] })

  const rows = await prisma.love.findMany({
    where: { visitorId },
    select: { collectionId: true },
  })
  return NextResponse.json({ loved: rows.map((r) => r.collectionId) })
}

/** Toggles this browser's love for one collection. */
export async function POST(request: NextRequest) {
  let body: { collectionId?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 })
  }

  const collectionId = Number(body.collectionId)
  if (!Number.isInteger(collectionId)) {
    return NextResponse.json({ error: "Unknown collection." }, { status: 400 })
  }

  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    select: { id: true },
  })
  if (!collection) {
    return NextResponse.json({ error: "Unknown collection." }, { status: 404 })
  }

  const { id: visitorId, isNew } = resolveVisitorId(request)

  const existing = isNew
    ? null
    : await prisma.love.findUnique({
        where: { collectionId_visitorId: { collectionId, visitorId } },
      })

  if (existing) {
    await prisma.love.delete({ where: { id: existing.id } })
  } else {
    // upsert rather than create: a double-click would otherwise hit the
    // unique (collectionId, visitorId) constraint.
    await prisma.love.upsert({
      where: { collectionId_visitorId: { collectionId, visitorId } },
      create: { collectionId, visitorId },
      update: {},
    })
  }

  const count = await prisma.love.count({ where: { collectionId } })
  const response = NextResponse.json({ collectionId, count, loved: !existing })
  if (isNew) setVisitorCookie(response, visitorId)
  return response
}
