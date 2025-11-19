import { createError, eventHandler, getHeader, readRawBody } from 'h3'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { prisma } from '../../utils/prisma'
import { getStravaConfig } from '../../utils/strava'
import { processStravaWebhookDirectly, type StravaWebhookPayload } from '../../utils/stravaWebhook'

export default eventHandler(async (event) => {
  const rawBody = (await readRawBody(event, 'utf8')) || ''
  let payload: StravaWebhookPayload

  try {
    payload = rawBody ? (JSON.parse(rawBody) as StravaWebhookPayload) : {}
  } catch {
    throw createError({ statusCode: 400, message: 'Ungültiges JSON.' })
  }

  const deliveryId = getHeader(event, 'x-strava-delivery-id') || null
  const signatureHeader = getHeader(event, 'x-strava-signature') || ''

  const signatureValid = verifySignature(signatureHeader, rawBody)
  if (signatureValid === false) {
    throw createError({ statusCode: 401, message: 'Signatur ungültig.' })
  }

  // Optional: Event für Logging speichern (nicht für Verarbeitung)
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

  // Event für Logging speichern (optional, kann auch weggelassen werden)
  try {
    await prisma.stravaWebhookEvent.create({
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
        processedAt: new Date(), // Sofort als verarbeitet markieren
      },
    })
  } catch (err) {
    // Logging-Fehler ignorieren, Hauptverarbeitung ist wichtiger
    if (process.dev) {
      console.warn('[strava-webhook] Logging fehlgeschlagen', err)
    }
  }

  // Direkte Verarbeitung - sofort und synchron
  try {
    await processStravaWebhookDirectly(payload)
  } catch (err) {
    console.error('[strava-webhook] Verarbeitung fehlgeschlagen', err)
    // Fehler weiterwerfen, damit Strava weiß, dass etwas schiefging
    throw createError({ statusCode: 500, message: 'Webhook-Verarbeitung fehlgeschlagen.' })
  }

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
