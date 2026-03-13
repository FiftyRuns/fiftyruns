import { defineEventHandler, readBody, createError } from 'h3'
import Anthropic from '@anthropic-ai/sdk'
import { resolveSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await resolveSession(event)
  if (!session) throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })

  const { text } = await readBody<{ text?: string }>(event)

  if (text && text.length > 500) {
    throw createError({ statusCode: 400, message: 'Text darf maximal 500 Zeichen lang sein.' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw createError({ statusCode: 500, message: 'ANTHROPIC_API_KEY fehlt.' })

  const client = new Anthropic({ apiKey })

  const prompt = `Du schreibst eine kurze, persönliche "Über mich"-Beschreibung für ein Läufer-Profil in einer Community-App (max. 280 Zeichen).${text ? ` Nutzer-Entwurf: "${text}". Formuliere ihn ansprechender und motivierender aus.` : ' Schreibe eine inspirierende, allgemeine Läufer-Bio.'} Antworte nur mit dem Text, ohne Anführungszeichen oder Erklärungen.`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 150,
    messages: [{ role: 'user', content: prompt }],
  })

  const result = (message.content[0] as { type: string; text: string }).text?.trim() ?? ''
  return { text: result.slice(0, 280) }
})
