/**
 * Snapshots every table to backups/<timestamp>.json, images included.
 *
 * There was no backup the day the production database was dropped, and the
 * collections had to be reconstructed by hand. Run this before anything that
 * touches the schema.
 *
 *   npm run db:export                          # whatever DATABASE_URL points at
 *   set -a && . .env.production.local && set +a && npm run db:export
 */
import { PrismaClient } from "@prisma/client"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

const prisma = new PrismaClient()

async function main() {
  const [collections, submissions, loves, visitors, xAvatars, assets] = await Promise.all([
    prisma.collection.findMany({ orderBy: { id: "asc" } }),
    prisma.submission.findMany({ orderBy: { id: "asc" } }),
    prisma.love.findMany({ orderBy: { id: "asc" } }),
    prisma.visitor.findMany(),
    prisma.xAvatar.findMany(),
    prisma.asset.findMany(),
  ])

  const snapshot = {
    takenAt: new Date().toISOString(),
    counts: {
      collections: collections.length,
      submissions: submissions.length,
      loves: loves.length,
      visitors: visitors.length,
      xAvatars: xAvatars.length,
      assets: assets.length,
    },
    collections,
    submissions,
    loves,
    visitors,
    xAvatars,
    // Binary columns are not JSON, so images ride along as base64.
    assets: assets.map((a) => ({
      id: a.id,
      mime: a.mime,
      createdAt: a.createdAt,
      bytesBase64: Buffer.from(a.bytes).toString("base64"),
    })),
  }

  const dir = path.join(process.cwd(), "backups")
  await mkdir(dir, { recursive: true })
  const file = path.join(dir, `${snapshot.takenAt.replace(/[:.]/g, "-")}.json`)
  await writeFile(file, JSON.stringify(snapshot, null, 2))

  const mb = (Buffer.byteLength(JSON.stringify(snapshot)) / 1024 / 1024).toFixed(2)
  console.log(`snapshot -> ${path.relative(process.cwd(), file)}  (${mb} MB)`)
  console.log(Object.entries(snapshot.counts).map(([k, v]) => `  ${k}: ${v}`).join("\n"))
}
main().catch((e) => { console.error("EXPORT FAILED:", e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
