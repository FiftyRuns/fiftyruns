import { createError } from 'h3'

const ISO_UTC_TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

export function getCurrentPostingSeason() {
  return String(new Date().getFullYear())
}

export function parsePostingDateInput(value?: string | null) {
  if (!value) {
    return new Date()
  }

  const raw = value.trim()
  if (!ISO_UTC_TIMESTAMP_RE.test(raw)) {
    throw invalidPostingDate()
  }

  const date = new Date(raw)
  if (Number.isNaN(date.getTime()) || date.toISOString() !== raw) {
    throw invalidPostingDate()
  }

  const currentSeason = getCurrentPostingSeason()
  if (String(date.getFullYear()) !== currentSeason) {
    throw createError({
      statusCode: 400,
      message: `Datum muss in der aktuellen Saison ${currentSeason} liegen.`,
    })
  }

  return date
}

function invalidPostingDate() {
  return createError({ statusCode: 400, message: 'Ungültiges Datum.' })
}
