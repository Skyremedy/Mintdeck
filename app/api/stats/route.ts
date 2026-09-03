import { NextResponse } from "next/server"
import { getPublicVisitorStats } from "../../../lib/queries"

/** Feeds the header counters so "online now" keeps moving without a reload. */
export async function GET() {
  const stats = await getPublicVisitorStats()
  return NextResponse.json(stats, {
    headers: { "cache-control": "no-store" },
  })
}
