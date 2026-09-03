"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import prisma from "./db"
import { CATEGORIES, PRICE_TYPES } from "./constants"
import { extractXHandle, xProfileUrl } from "./x"
import { avatarFailureMessage, getXAvatar, type AvatarFailure } from "./x-avatar"
import { ALLOWED_IMAGE_MIME, MAX_ASSET_BYTES, storeAsset } from "./assets"
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  checkCredentials,
  createSessionToken,
  verifySessionToken,
} from "./auth"

export type ActionState = { error?: string; ok?: boolean }

/** Every admin action re-checks the session: server actions are reachable by
 *  direct POST, so `proxy.ts` alone is not authorization. */
async function requireAdmin(): Promise<void> {
  const store = await cookies()
  const ok = await verifySessionToken(store.get(SESSION_COOKIE)?.value)
  if (!ok) throw new Error("Unauthorized")
}

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const username = String(formData.get("username") ?? "")
  const password = String(formData.get("password") ?? "")
  const next = String(formData.get("next") ?? "/admin")

  if (!checkCredentials(username, password)) {
    return { error: "Incorrect username or password." }
  }

  const store = await cookies()
  store.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  })

  redirect(next.startsWith("/admin") ? next : "/admin")
}

export async function logout() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
  redirect("/admin/login")
}

/** Stores an uploaded logo and returns the path the browser should request. */
async function storeLogo(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null
  if (!ALLOWED_IMAGE_MIME.test(file.type)) {
    throw new Error("Logo must be a PNG, JPEG, WEBP, GIF or SVG.")
  }
  if (file.size > MAX_ASSET_BYTES) throw new Error("Logo must be under 2 MB.")

  return storeAsset(await file.arrayBuffer(), file.type)
}

function cleanUrl(value: FormDataEntryValue | null): string | null {
  const raw = String(value ?? "").trim()
  if (!raw) return null
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  try {
    return new URL(withScheme).toString()
  } catch {
    return null
  }
}

type CollectionInput = {
  name: string
  logo: string
  category: string
  mintAt: Date | null
  timeTba: boolean
  supply: number | null
  priceType: string
  priceValue: number | null
  priceCurrency: string | null
  website: string | null
  twitter: string | null
  discord: string | null
  telegram: string | null
  opensea: string | null
  status: string
  pinnedPosition: number | null
}

async function parseCollection(formData: FormData, currentLogo?: string): Promise<CollectionInput> {
  const name = String(formData.get("name") ?? "").trim()
  if (!name) throw new Error("Collection name is required.")

  const category = String(formData.get("category") ?? "")
  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    throw new Error("Pick a valid chain.")
  }

  // X handle drives both the profile link and, when no logo was given, the logo.
  const xHandle = extractXHandle(String(formData.get("twitter") ?? ""))
  const twitter = xHandle ? xProfileUrl(xHandle) : cleanUrl(formData.get("twitter"))

  const uploaded = await storeLogo(formData.get("logoFile") as File | null)
  let logo = uploaded ?? cleanUrl(formData.get("logoUrl")) ?? currentLogo ?? ""

  // Falls back to the X avatar, which is almost always already cached by the
  // form's preview, so saving costs no upstream request.
  let avatarFailure: AvatarFailure | null = null
  if (!logo && xHandle) {
    const avatar = await getXAvatar(xHandle)
    if (avatar.ok) logo = avatar.publicPath
    else avatarFailure = avatar.reason
  }

  if (!logo) {
    throw new Error(
      xHandle && avatarFailure
        ? avatarFailureMessage(xHandle, avatarFailure)
        : "Add a logo — upload a file, paste an image URL, or set the X handle."
    )
  }

  const dateTba = formData.get("dateTba") === "on"
  const dateRaw = String(formData.get("mintDate") ?? "").trim()
  const timeRaw = String(formData.get("mintTime") ?? "").trim()

  let mintAt: Date | null = null
  let timeTba = false
  if (!dateTba) {
    if (!dateRaw) throw new Error("Set a mint date, or mark the date as TBA.")
    timeTba = !timeRaw
    mintAt = new Date(`${dateRaw}T${timeRaw || "00:00"}:00.000Z`)
    if (Number.isNaN(mintAt.getTime())) throw new Error("That mint date/time is not valid.")
  }

  const supplyRaw = String(formData.get("supply") ?? "").trim()
  let supply: number | null = null
  if (supplyRaw) {
    const parsed = Number(supplyRaw)
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new Error("Supply must be a whole number of items, or left empty for TBA.")
    }
    supply = parsed
  }

  const priceType = String(formData.get("priceType") ?? "TBA")
  if (!PRICE_TYPES.includes(priceType as (typeof PRICE_TYPES)[number])) {
    throw new Error("Pick a valid price type.")
  }

  let priceValue: number | null = null
  let priceCurrency: string | null = null
  if (priceType === "Price") {
    priceValue = Number(formData.get("priceValue"))
    if (!Number.isFinite(priceValue) || priceValue < 0) throw new Error("Enter a valid mint price.")
    priceCurrency = String(formData.get("priceCurrency") ?? "").trim() || null
    if (!priceCurrency) throw new Error("Pick a currency for the mint price.")
  }

  const pinnedRaw = String(formData.get("pinnedPosition") ?? "").trim()
  const pinnedPosition = pinnedRaw ? Math.max(1, Math.trunc(Number(pinnedRaw))) : null
  if (pinnedRaw && !Number.isFinite(Number(pinnedRaw))) throw new Error("Pin position must be a number.")

  return {
    name,
    logo,
    category,
    mintAt,
    timeTba,
    supply,
    priceType,
    priceValue,
    priceCurrency,
    website: cleanUrl(formData.get("website")),
    twitter,
    discord: cleanUrl(formData.get("discord")),
    telegram: cleanUrl(formData.get("telegram")),
    opensea: cleanUrl(formData.get("opensea")),
    status: formData.get("status") === "Past" ? "Past" : "Upcoming",
    pinnedPosition,
  }
}

function revalidateAll() {
  revalidatePath("/")
  revalidatePath("/past")
  revalidatePath("/admin")
  revalidatePath("/admin/collections")
}

export async function createCollection(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin()
  let data: CollectionInput
  try {
    data = await parseCollection(formData)
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save that collection." }
  }

  await prisma.collection.create({ data })

  const submissionId = Number(formData.get("submissionId"))
  if (Number.isFinite(submissionId) && submissionId > 0) {
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: "Approved", reviewedAt: new Date() },
    })
  }

  revalidateAll()
  redirect("/admin/collections")
}

export async function updateCollection(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin()
  const id = Number(formData.get("id"))
  if (!Number.isFinite(id)) return { error: "Unknown collection." }

  const current = await prisma.collection.findUnique({ where: { id } })
  if (!current) return { error: "That collection no longer exists." }

  let data: CollectionInput
  try {
    data = await parseCollection(formData, current.logo)
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save that collection." }
  }

  await prisma.collection.update({ where: { id }, data })
  revalidateAll()
  redirect("/admin/collections")
}

export async function deleteCollection(formData: FormData) {
  await requireAdmin()
  const id = Number(formData.get("id"))
  if (Number.isFinite(id)) await prisma.collection.delete({ where: { id } })
  revalidateAll()
}

/** Pin to a slot, or unpin when `position` is empty. */
export async function setPinnedPosition(formData: FormData) {
  await requireAdmin()
  const id = Number(formData.get("id"))
  const raw = String(formData.get("position") ?? "").trim()
  const position = raw ? Math.max(1, Math.trunc(Number(raw))) : null
  if (!Number.isFinite(id)) return
  if (raw && !Number.isFinite(Number(raw))) return

  await prisma.collection.update({ where: { id }, data: { pinnedPosition: position } })
  revalidateAll()
}

export async function resetClicks(formData: FormData) {
  await requireAdmin()
  const id = Number(formData.get("id"))
  if (Number.isFinite(id)) {
    await prisma.collection.update({ where: { id }, data: { clickCount: 0 } })
  }
  revalidateAll()
}

export async function rejectSubmission(formData: FormData) {
  await requireAdmin()
  const id = Number(formData.get("id"))
  if (Number.isFinite(id)) {
    await prisma.submission.update({
      where: { id },
      data: { status: "Rejected", reviewedAt: new Date() },
    })
  }
  revalidatePath("/admin")
}

export async function deleteSubmission(formData: FormData) {
  await requireAdmin()
  const id = Number(formData.get("id"))
  if (Number.isFinite(id)) await prisma.submission.delete({ where: { id } })
  revalidatePath("/admin")
}
