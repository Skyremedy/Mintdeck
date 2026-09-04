import { PrismaClient } from "@prisma/client"

/**
 * Every serverless instance opens its own connection pool, and Prisma's default
 * pool size is several connections per instance. Against a direct Postgres
 * connection (no pgbouncer in front) a burst of traffic multiplies those out
 * until the server refuses new ones — which is exactly how the site went down
 * with "too many connections for role prisma_migration".
 *
 * One connection per instance is the standard fix for serverless: instances are
 * short-lived and handle one request at a time, so a bigger pool buys nothing
 * and costs headroom shared with every other instance.
 */
function serverlessUrl(): string | undefined {
  const raw = process.env.DATABASE_URL
  if (!raw) return undefined

  try {
    const url = new URL(raw)
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", "1")
    }
    if (!url.searchParams.has("pool_timeout")) {
      // Wait briefly for a free connection rather than failing the request.
      url.searchParams.set("pool_timeout", "15")
    }
    if (!url.searchParams.has("connect_timeout")) {
      url.searchParams.set("connect_timeout", "10")
    }
    return url.toString()
  } catch {
    return raw
  }
}

const prismaClientSingleton = () => {
  const url = serverlessUrl()
  return url ? new PrismaClient({ datasources: { db: { url } } }) : new PrismaClient()
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma
