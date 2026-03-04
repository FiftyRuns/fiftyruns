import { PrismaClient } from '../../prisma/generated/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const { Pool } = pg
const connectionString = `${process.env.DATABASE_URL}`

const schemaMatch = connectionString.match(/[?&]schema=([^&]+)/)
const schema = schemaMatch ? schemaMatch[1] : 'public'

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } })
const adapter = new PrismaPg(pool, { schema })

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
