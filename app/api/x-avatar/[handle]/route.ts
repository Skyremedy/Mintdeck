import { NextResponse } from "next/server"
import { extractXHandle } from "../../../../lib/x"
import { getXAvatar } from "../../../../lib/x-avatar"

/**
 * Serves an X profile picture from the local cache, fetching it once on a miss.
 * The admin form points <img> here rather than at the resolver, so previewing
 * the same handle repeatedly costs nothing upstream.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle: raw } = await params
  const handle = extractXHandle(raw)
  if (!handle) {
    return NextResponse.json({ error: "Not a valid X handle." }, { status: 400 })
  }

  const result = await getXAvatar(handle)
  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason },
      { status: result.reason === "rate-limited" ? 429 : 404 }
    )
  }

  // Redirect to the static file so Next serves the bytes, not this handler.
  return NextResponse.redirect(new URL(result.publicPath, _request.url), {
    status: 307,
  })
}
