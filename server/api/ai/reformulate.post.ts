import { defineEventHandler, readBody, createError } from 'h3'
import Anthropic from '@anthropic-ai/sdk'
import { resolveSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await resolveSession(event)
  if (!session) throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })

  const { text, distanceKm, duration } = await readBody<{ text?: string; distanceKm?: string; duration?: string }>(event)

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw createError({ statusCode: 500, message: 'ANTHROPIC_API_KEY fehlt.' })

  const client = new Anthropic({ apiKey })

  const context = [
    distanceKm ? `Distanz: ${distanceKm} km` : '',
    duration ? `Zeit: ${duration}` : '',
  ].filter(Boolean).join(', ')

  const prompt = `Du schreibst einen kurzen, motivierenden Laufpost für eine Fitness-Community-App (max. 240 Zeichen).${context ? ` Der Lauf hatte folgende Daten: ${context}.` : ''}${text ? ` Nutzer-Entwurf: "${text}". Formuliere ihn schöner aus.` : ' Schreibe einen passenden Post.'} Antworte nur mit dem Post-Text, ohne Anführungszeichen oder Erklärungen.`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 120,
    messages: [{ role: 'user', content: prompt }],
  })

  const result = (message.content[0] as { type: string; text: string }).text?.trim() ?? ''
  return { text: result.slice(0, 240) }
})
