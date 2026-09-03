import prisma from "./db"
import { toView, type CollectionView } from "./format"
import { CATEGORIES } from "./constants"

/**
 * Move mints whose window has closed into the archive. Runs on read, which is
 * enough for V1 — no cron needed, and every page that lists mints sees a
 * consistent split between Upcoming and Past.
 */
export async function syncMintStatuses(): Promise<void> {
  const now = new Date()
  const startOfToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  )

  await prisma.$transaction([
    // Exact-time mints archive the moment they start.
    prisma.collection.updateMany({
      where: { status: "Upcoming", timeTba: false, mintAt: { lt: now } },
      data: { status: "Past" },
    }),
    // Day-only mints stay up for the whole of their day.
    prisma.collection.updateMany({
      where: { status: "Upcoming", timeTba: true, mintAt: { lt: startOfToday } },
      data: { status: "Past" },
    }),
  ])
}

export async function getUpcoming(): Promise<CollectionView[]> {
  await syncMintStatuses()
  const rows = await prisma.collection.findMany({
    where: { status: "Upcoming" },
    orderBy: [{ mintAt: "asc" }, { name: "asc" }],
    include: { _count: { select: { loves: true } } },
  })
  return rows.map(toView)
}

export async function getPast(): Promise<CollectionView[]> {
  await syncMintStatuses()
  const rows = await prisma.collection.findMany({
    where: { status: "Past" },
    orderBy: [{ mintAt: "desc" }, { name: "asc" }],
    include: { _count: { select: { loves: true } } },
  })
  return rows.map(toView)
}

export async function getAllCollections(): Promise<CollectionView[]> {
  await syncMintStatuses()
  const rows = await prisma.collection.findMany({
    orderBy: [{ createdAt: "desc" }],
    include: { _count: { select: { loves: true } } },
  })
  return rows.map(toView)
}

export async function getCollection(id: number): Promise<CollectionView | null> {
  const row = await prisma.collection.findUnique({
    where: { id },
    include: { _count: { select: { loves: true } } },
  })
  return row ? toView(row) : null
}

const ONLINE_WINDOW_MS = 5 * 60 * 1000

export type AdminStats = {
  visitors: { today: number; week: number; month: number; allTime: number }
  onlineNow: number
  totalCollections: number
  upcoming: number
  past: number
  pendingSubmissions: number
  perCategory: { category: string; count: number }[]
  totalClicks: number
  loves: number
}

export async function getAdminStats(): Promise<AdminStats> {
  const now = Date.now()
  const since = (ms: number) => new Date(now - ms)
  const day = 24 * 60 * 60 * 1000
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const [
    today,
    week,
    month,
    allTime,
    onlineNow,
    totalCollections,
    upcoming,
    past,
    pendingSubmissions,
    grouped,
    clickAgg,
    loves,
  ] = await Promise.all([
    prisma.visitor.count({ where: { lastSeen: { gte: startOfToday } } }),
    prisma.visitor.count({ where: { lastSeen: { gte: since(7 * day) } } }),
    prisma.visitor.count({ where: { lastSeen: { gte: since(30 * day) } } }),
    prisma.visitor.count(),
    prisma.visitor.count({ where: { lastSeen: { gte: since(ONLINE_WINDOW_MS) } } }),
    prisma.collection.count(),
    prisma.collection.count({ where: { status: "Upcoming" } }),
    prisma.collection.count({ where: { status: "Past" } }),
    prisma.submission.count({ where: { status: "Pending" } }),
    prisma.collection.groupBy({ by: ["category"], _count: { _all: true } }),
    prisma.collection.aggregate({ _sum: { clickCount: true } }),
    prisma.love.count(),
  ])

  const counts = new Map(grouped.map((g) => [g.category, g._count._all]))

  return {
    visitors: { today, week, month, allTime },
    onlineNow,
    totalCollections,
    upcoming,
    past,
    pendingSubmissions,
    perCategory: CATEGORIES.map((c) => ({ category: c, count: counts.get(c) ?? 0 })),
    totalClicks: clickAgg._sum.clickCount ?? 0,
    loves,
  }
}

export async function getSubmissions() {
  const rows = await prisma.submission.findMany({
    orderBy: [{ submittedAt: "desc" }],
    take: 100,
  })
  return rows.map((s) => ({
    id: s.id,
    handle: s.handle,
    status: s.status,
    submittedAt: s.submittedAt.toISOString(),
    reviewedAt: s.reviewedAt ? s.reviewedAt.toISOString() : null,
  }))
}
