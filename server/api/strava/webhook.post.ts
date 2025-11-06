import { createError, eventHandler, getHeader, readRawBody } from 'h3'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { prisma } from '../../utils/prisma'
import { getStravaConfig } from '../../utils/strava'
import { processStravaWebhookEvent } from '../../utils/stravaWebhook'

type IncomingWebhook = {
  object_type?: string
  object_id?: number | string | null
  aspect_type?: string
  owner_id?: number | string | null
  subscription_id?: number
  updates?: Record<string, unknown>
  event_time?: number
}

export default eventHandler(async (event) => {
  const rawBody = (await readRawBody(event, 'utf8')) || ''
  let payload: IncomingWebhook

  try {
    payload = rawBody ? (JSON.parse(rawBody) as IncomingWebhook) : {}
  } catch {
    throw createError({ statusCode: 400, message: 'Ungültiges JSON.' })
  }

  const deliveryId = getHeader(event, 'x-strava-delivery-id') || null
  const signatureHeader = getHeader(event, 'x-strava-signature') || ''

  const signatureValid = verifySignature(signatureHeader, rawBody)
  if (signatureValid === false) {
    throw createError({ statusCode: 401, message: 'Signatur ungültig.' })
  }

  const eventTime = typeof payload.event_time === 'number' ? new Date(payload.event_time * 1000) : new Date()
  const objectId =
    typeof payload.object_id === 'number' || typeof payload.object_id === 'string'
      ? String(payload.object_id)
      : null
  const ownerId =
    typeof payload.owner_id === 'number' || typeof payload.owner_id === 'string'
      ? String(payload.owner_id)
      : null
  const subscriptionId = typeof payload.subscription_id === 'number' ? payload.subscription_id : null

  const record = await prisma.stravaWebhookEvent.create({
    data: {
      deliveryId,
      eventTime,
      objectType: String(payload.object_type ?? ''),
      aspectType: String(payload.aspect_type ?? ''),
      objectId,
      ownerId,
      subscriptionId,
      updates: payload.updates ? payload.updates as any : undefined,
      signatureValid: signatureValid ?? null,
    },
  })

  queueMicrotask(() => {
    processStravaWebhookEvent(record.id).catch((err) => {
      if (process.dev) {
        console.error('[strava-webhook] Hintergrundverarbeitung fehlgeschlagen', err)
      }
    })
  })

  return { ok: true }
})

function verifySignature(signatureHeader: string, rawBody: string): boolean | null {
  if (!signatureHeader) return null

  const [scheme, signature] = signatureHeader.split('=')
  if (scheme !== 'sha256' || !signature) return false

  const { clientSecret } = getStravaConfig()
  const computed = createHmac('sha256', clientSecret).update(rawBody).digest('hex')

  try {
    const provided = Buffer.from(signature, 'hex')
    const expected = Buffer.from(computed, 'hex')
    if (provided.length !== expected.length) return false
    return timingSafeEqual(provided, expected)
  } catch {
    return false
  }
}
