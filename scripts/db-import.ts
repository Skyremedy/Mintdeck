/**
 * Restores a snapshot written by db-export. Rows that already exist are left
 * alone, so this is safe to re-run and safe to point at a partially-populated
 * database.
 *
 *   npm run db:import backups/2026-09-04T....json
 */
import { PrismaClient } from "@prisma/client"
import { readFile } from "node:fs/promises"

const prisma = new PrismaClient()

async function main() {
  const file = process.argv[2]
  if (!file) throw new Error("usage: npm run db:import <backups/file.json>")

  const snap = JSON.parse(await readFile(file, "utf8"))
  console.log(`restoring snapshot from ${snap.takenAt}`)

  // Assets first: collections reference them by URL.
  for (const a of snap.assets ?? []) {
    await prisma.asset.upsert({
      where: { id: a.id },
      create: { id: a.id, mime: a.mime, bytes: Buffer.from(a.bytesBase64, "base64"), createdAt: new Date(a.createdAt) },
      update: {},
    })
  }
  for (const c of snap.collections ?? []) {
    await prisma.collection.upsert({
      where: { id: c.id },
      create: { ...c, mintAt: c.mintAt ? new Date(c.mintAt) : null, createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt) },
      update: {},
    })
  }
  for (const s of snap.submissions ?? []) {
    await prisma.submission.upsert({ where: { id: s.id }, create: { ...s, submittedAt: new Date(s.submittedAt), reviewedAt: s.reviewedAt ? new Date(s.reviewedAt) : null }, update: {} })
  }
  for (const l of snap.loves ?? []) {
    await prisma.love.upsert({ where: { id: l.id }, create: { ...l, createdAt: new Date(l.createdAt) }, update: {} })
  }
  for (const v of snap.visitors ?? []) {
    await prisma.visitor.upsert({ where: { id: v.id }, create: { ...v, firstSeen: new Date(v.firstSeen), lastSeen: new Date(v.lastSeen) }, update: {} })
  }
  for (const x of snap.xAvatars ?? []) {
    await prisma.xAvatar.upsert({ where: { handle: x.handle }, create: { ...x, fetchedAt: new Date(x.fetchedAt) }, update: {} })
  }

  console.log("restored:", (await prisma.collection.count()), "collections,", (await prisma.asset.count()), "assets")
}
main().catch((e) => { console.error("IMPORT FAILED:", e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
