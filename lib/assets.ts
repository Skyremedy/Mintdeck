import "server-only"

import { randomUUID } from "node:crypto"
import prisma from "./db"

/**
 * Image storage for logos and cached X avatars.
 *
 * The app runs on a read-only filesystem in production (a serverless host
 * unpacks the bundle at a path it will not let you write to, and the only
 * writable directory is a scratch space that is wiped between requests). Bytes
 * therefore go in the database and are served back by `/api/asset/[id]`.
 */

export const ASSET_URL_PREFIX = "/api/asset"

export const ALLOWED_IMAGE_MIME = /^image\/(png|jpeg|webp|gif|svg\+xml)$/
export const MAX_ASSET_BYTES = 2 * 1024 * 1024

/** Stores an image and returns the path the browser should request. */
export async function storeAsset(bytes: ArrayBuffer, mime: string): Promise<string> {
  const id = randomUUID()
  await prisma.asset.create({
    data: { id, mime, bytes: Buffer.from(bytes) },
  })
  return assetUrl(id)
}

export function assetUrl(id: string): string {
  return `${ASSET_URL_PREFIX}/${id}`
}
