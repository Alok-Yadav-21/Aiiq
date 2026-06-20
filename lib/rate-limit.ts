/**
 * Lightweight in-memory rate limiter (fixed window).
 *
 * Runs inside the single custom Node server (server.js), so a process-local
 * Map is sufficient and needs no external infrastructure. Counts reset when
 * the window expires; expired buckets are swept opportunistically so memory
 * stays bounded.
 *
 * Note: limits are per-process and reset on server restart — appropriate for
 * abuse prevention (e.g. blocking password-reset email bombing), not for
 * strict quota enforcement.
 */

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
let lastSweep = 0

function sweep(now: number) {
  // Sweep at most once per minute to keep the map from growing unbounded.
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [key, b] of buckets) {
    if (b.resetAt < now) buckets.delete(key)
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSec: number
}

/**
 * Record a hit against `key` and report whether it's allowed.
 * @param key      Unique bucket key (e.g. `forgot:ip:1.2.3.4`).
 * @param limit    Max allowed hits within the window.
 * @param windowMs Window length in milliseconds.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  sweep(now)

  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, retryAfterSec: 0 }
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) }
  }

  bucket.count++
  return { allowed: true, remaining: limit - bucket.count, retryAfterSec: 0 }
}

/** Best-effort client IP extraction from common proxy headers. */
export function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip')?.trim() || 'unknown'
}
