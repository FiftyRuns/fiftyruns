import { defineEventHandler, setHeaders } from 'h3'

export default defineEventHandler((event) => {
  setHeaders(event, {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'X-DNS-Prefetch-Control': 'off',
  })

  if (process.env.NODE_ENV === 'production') {
    setHeaders(event, {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    })
  }
})
