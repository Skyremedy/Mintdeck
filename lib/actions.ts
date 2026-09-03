"use server"

import prisma from "./db"
import { extractXHandle } from "./x"

/** Bumps the trending counter. Deliberately does not revalidate: a click must
 *  never re-order the grid under the cursor of the person who clicked. */
export async function recordClick(id: number) {
  try {
    await prisma.collection.update({
      where: { id },
      data: { clickCount: { increment: 1 } },
    })
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: "Could not record that click." }
  }
}

export async function submitHandle(rawHandle: string) {
  if (!rawHandle.trim()) return { ok: false as const, error: "Enter a handle first." }

  // Accepts "@name", "name", or a pasted x.com/twitter.com profile URL.
  const handle = extractXHandle(rawHandle)
  if (!handle) {
    return { ok: false as const, error: "Use an X handle or profile link, e.g. @mintdeck." }
  }

  const normalized = `@${handle}`
  const existing = await prisma.submission.findFirst({
    where: { handle: normalized, status: "Pending" },
  })
  if (existing) {
    return { ok: true as const, message: "Already in the queue — thanks!" }
  }

  await prisma.submission.create({ data: { handle: normalized } })
  return { ok: true as const, message: "Thanks — we'll review this soon." }
}
