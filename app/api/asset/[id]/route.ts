import prisma from "../../../../lib/db"

/**
 * Serves an image out of the database. Ids are random and an asset's bytes
 * never change, so the response is immutably cacheable — the CDN and the
 * browser answer nearly every request without touching this function.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const asset = await prisma.asset.findUnique({ where: { id } })
  if (!asset) {
    return new Response("Not found", { status: 404 })
  }

  return new Response(new Uint8Array(asset.bytes), {
    headers: {
      "content-type": asset.mime,
      "content-length": String(asset.bytes.byteLength),
      "cache-control": "public, max-age=31536000, immutable",
    },
  })
}
