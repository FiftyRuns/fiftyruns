import { defineEventHandler, setHeaders } from 'h3'

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.bunny.net",
  "img-src 'self' data: blob: https://*.blob.vercel-storage.com https://50runs.com",
  "font-src 'self' data: https://fonts.bunny.net",
  "connect-src 'self' https://vercel.com https://*.vercel-storage.com https://fonts.bunny.net",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

export default defineEventHandler((event) => {
  setHeaders(event, {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'X-DNS-Prefetch-Control': 'off',
    'Content-Security-Policy': csp,
  })

  if (process.env.NODE_ENV === 'production') {
    setHeaders(event, {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    })
  }
})
