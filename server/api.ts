import { createHmac, randomBytes } from 'node:crypto'
import { bookingSchema } from '../src/booking-schema'
import type { BookingStore } from './store'

export const securityHeaders = {
  'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow',
  'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' https://challenges.cloudflare.com; style-src 'self'; img-src 'self'; connect-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
}
type Options = { origin: string; store?: BookingStore; syntheticOnly?: boolean; challengeSiteKey?: string; verifyChallenge?: (token: string, ip: string) => Promise<boolean>; now?: () => number }
export function createApi(options: Options) {
  const counters = new Map<string, { count: number; end: number }>()
  const salt = randomBytes(32)
  const now = options.now ?? Date.now
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...securityHeaders, 'Content-Type': 'application/json', ...(status === 429 ? { 'Retry-After': '60' } : {}) } })
  function consume(scope: string, identity: string, limit: number) {
    const time = now()
    for (const [key, bucket] of counters) if (bucket.end <= time) counters.delete(key)
    const key = createHmac('sha256', salt).update(`${scope}:${identity}`).digest('hex')
    if (!counters.has(key) && counters.size >= 10000) return false
    const bucket = counters.get(key) ?? { count: 0, end: time + 60000 }
    bucket.count++; counters.set(key, bucket)
    return bucket.count <= limit
  }
  return async (request: Request, ip: string): Promise<Response> => {
    const url = new URL(request.url)
    if (!consume('all', ip, 60)) return json({ code: 'RATE_LIMITED' }, 429)
    if (url.pathname === '/api/config' && request.method === 'GET') return json({ bookingEnabled: Boolean(options.store), syntheticOnly: options.syntheticOnly !== false, challengeSiteKey: options.challengeSiteKey ?? null })
    if (url.pathname.startsWith('/api/receipts/') && request.method === 'GET') {
      if (!consume('receipt', ip, 20)) return json({ code: 'RATE_LIMITED' }, 429)
      const reference = url.pathname.slice('/api/receipts/'.length)
      if (!/^[a-f0-9]{64}$/.test(reference) || !options.store) return json({ code: 'NOT_AVAILABLE' }, 404)
      try { const receipt = await options.store.receipt(reference); return receipt ? json({ status: receipt.status, handling: receipt.handling }) : json({ code: 'NOT_AVAILABLE' }, 404) }
      catch { return json({ code: 'NOT_AVAILABLE' }, 404) }
    }
    if (url.pathname !== '/api/bookings' || request.method !== 'POST') return json({ code: 'NOT_AVAILABLE' }, 404)
    if (request.headers.get('origin') !== options.origin) return json({ code: 'NOT_AVAILABLE' }, 403)
    if (!consume('booking', ip, 5)) return json({ code: 'RATE_LIMITED' }, 429)
    if (!options.store) return json({ code: 'UNAVAILABLE' }, 503)
    if (!request.headers.get('content-type')?.startsWith('application/json')) return json({ code: 'INVALID' }, 400)
    const raw = await request.text()
    if (Buffer.byteLength(raw) > 8192) return json({ code: 'INVALID' }, 413)
    let input
    try { input = bookingSchema.safeParse(JSON.parse(raw)) } catch { return json({ code: 'INVALID' }, 400) }
    if (!input.success || input.data.website !== '') return json({ code: 'INVALID' }, 400)
    if (options.syntheticOnly !== false && !/^[^@]+@example\.test$/.test(input.data.email)) return json({ code: 'SYNTHETIC_ONLY' }, 400)
    // Local synthetic mode has no external CAPTCHA; suspicious requests are denied.
    if (options.verifyChallenge) {
      if (!input.data.challengeToken || !await options.verifyChallenge(input.data.challengeToken, ip).catch(() => false)) return json({ code: 'CHALLENGE_REQUIRED' }, 403)
    } else if (!consume('unchallenged', ip, 2)) return json({ code: 'CHALLENGE_REQUIRED' }, 403)
    let owner: string | null = null
    const authorization = request.headers.get('authorization')
    if (authorization) {
      if (!authorization.startsWith('Bearer ') || authorization.length > 4096) return json({ code: 'NOT_AVAILABLE' }, 401)
      owner = await options.store.verifyUser(authorization.slice(7)).catch(() => null)
      if (!owner) return json({ code: 'NOT_AVAILABLE' }, 401)
      if (!consume('account', owner, 5)) return json({ code: 'RATE_LIMITED' }, 429)
    }
    try {
      const reference = randomBytes(32).toString('hex')
      const receipt = await options.store.create(input.data, owner, reference)
      return json({ reference: receipt.reference, status: 'REQUESTED', handling: 'MANUAL_PENDING' }, 201)
    } catch { return json({ code: 'UNAVAILABLE' }, 503) }
  }
}
