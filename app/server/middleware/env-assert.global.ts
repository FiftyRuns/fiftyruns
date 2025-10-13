import { H3Event, createError } from 'h3'
import { EventHandler } from 'h3'

function expectedSchema() {
  const vercelEnv = process.env.VERCEL_ENV || (process.env.NODE_ENV === 'production' ? 'production' : 'development')
  if (vercelEnv === 'production') return 'prod'
  if (vercelEnv === 'preview') return 'stage'
  return 'stage'
}

function actualSchemaFromDbUrl(url = process.env.DATABASE_URL || '') {
  const i = url.indexOf('schema=')
  if (i === -1) return null
  const tail = url.slice(i + 'schema='.length)
  return tail.split('&')[0]
}

export default defineEventHandler((event: H3Event) => {
  const expected = expectedSchema()
  const actual = actualSchemaFromDbUrl()
  if (!actual) return

  if (expected === 'prod' && actual !== 'prod') {
    throw createError({ statusCode: 500, statusMessage: `Env-Guard: erwartetes Schema "prod", gefunden "${actual}".` })
  }
  if (expected === 'stage' && actual !== 'stage') {
    throw createError({ statusCode: 500, statusMessage: `Env-Guard: erwartetes Schema "stage", gefunden "${actual}".` })
  }
})
function defineEventHandler(handler: (event: H3Event) => void): EventHandler {
    return handler as EventHandler
}

