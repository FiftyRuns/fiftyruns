const store = new Map<string, { count: number; expires: number }>()

let lastCleanup = Date.now()
const CLEANUP_INTERVAL = 60_000

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, entry] of store) {
    if (entry.expires <= now) store.delete(key)
  }
}

export function checkRateLimit(key: string, limit: number, windowSec: number): boolean {
  cleanup()
  const now = Date.now()
  const entry = store.get(key)

  if (entry && entry.expires > now) {
    if (entry.count >= limit) return false
    entry.count++
  } else {
    store.set(key, { count: 1, expires: now + windowSec * 1000 })
  }

  return true
}
