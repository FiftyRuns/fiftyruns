import { createError, eventHandler, readRawBody } from 'h3'
import { prisma } from '../../utils/prisma'
import { processGarminWebhookEvent } from '../../utils/garminWebhook'
import { type GarminWebhookPayload } from '../../utils/garmin'

export default eventHandler(async (event) => {
  const rawBody = (await readRawBody(event, 'utf8')) || ''
  let payload: GarminWebhookPayload

  try {
    payload = rawBody ? (JSON.parse(rawBody) as GarminWebhookPayload) : {}
  } catch {
    throw createError({ statusCode: 400, message: 'Ungültiges JSON.' })
  }

  // Event in Datenbank speichern (für Debugging und Retry-Logik)
  const record = await prisma.garminWebhookEvent.create({
    data: {
      payload: payload as any,
      receivedAt: new Date(),
    },
  })

  // Schnell mit 200 antworten (Garmin erwartet schnelle Antwort)
  // Verarbeitung asynchron im Hintergrund
  queueMicrotask(() => {
    processGarminWebhookEvent(record.id).catch((err) => {
      if (process.dev) {
        console.error('[garmin-webhook] Hintergrundverarbeitung fehlgeschlagen', err)
      }
    })
  })

  return { ok: true }
})

