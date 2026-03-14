import { getRequestURL, type H3Event } from 'h3'

/**
 * Determines the correct public callback URL for Vercel Blob uploads.
 * Uses PUBLIC_ORIGIN or VERCEL_URL if available, falls back to request URL.
 */
export function getBlobCallbackUrl(event: H3Event, path: string): string {
  const base =
    process.env.PUBLIC_ORIGIN ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    getRequestURL(event).origin

  return `${base}${path}`
}
