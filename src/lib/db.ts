import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Resolve the runtime datasource URL.
 *
 * Production (Vercel + Neon): the Storage integration injects DATABASE_URL as
 * a pooled connection string behind PgBouncer in transaction mode. Prisma's
 * prepared statements are incompatible with transaction-mode pooling unless
 * `pgbouncer=true` is set, so prefer the direct (unpooled) URL when available
 * and otherwise append the flag. Local SQLite URLs are passed through intact.
 */
function resolveDatasourceUrl(): string | undefined {
  const unpooled = process.env.DATABASE_URL_UNPOOLED
  const pooled = process.env.DATABASE_URL
  let url = unpooled ?? pooled
  if (!url || !url.startsWith("postgres")) return url ?? undefined
  if (!unpooled && !url.includes("pgbouncer=")) {
    url += (url.includes("?") ? "&" : "?") + "pgbouncer=true&connection_limit=5&pool_timeout=10"
  }
  return url
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: resolveDatasourceUrl(),
    log: process.env.NODE_ENV === 'development' ? ['query'] : ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
