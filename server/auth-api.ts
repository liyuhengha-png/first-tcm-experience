import { createHmac, randomBytes } from 'node:crypto'
import { z } from 'zod'
import { securityHeaders } from './api'
import type { emailAuth } from './email-auth'

type Provider = ReturnType<typeof emailAuth>
const input = z.object({ email: z.email().max(254), token: z.string().regex(/^\d{6,10}$/).optional(), challengeToken: z.string().max(2048).optional() }).strict()
// Single-process local preview sessions. Restart invalidates sessions; no refresh-token persistence.
export function createAuthApi({ origin, provider, now = Date.now, challengeSiteKey, verifyChallenge }: { origin: string; provider?: Provider; now?: () => number; challengeSiteKey?: string; verifyChallenge?: (token: string, ip: string) => Promise<boolean> }) {
  if (Boolean(challengeSiteKey) !== Boolean(verifyChallenge)) throw new Error('Incomplete auth challenge configuration')
  const sessions = new Map<string, { userId: string; accessToken: string; expires: number }>()
  const limits = new Map<string, { count: number; expires: number }>()
  const salt = randomBytes(32)
  const secure = new URL(origin).protocol === 'https:'
  const name = secure ? '__Host-tcm-session' : 'tcm-local-session'
  const response = (body: unknown, status = 200, cookie?: string) => new Response(JSON.stringify(body), { status, headers: { ...securityHeaders, 'Content-Type': 'application/json', ...(cookie ? { 'Set-Cookie': cookie } : {}) } })
  const cookie = (value: string, age: number) => `${name}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${secure ? '; Secure' : ''}`
  function consume(identity: string, maximum = 5) {
    for (const [key, value] of limits) if (value.expires <= now()) limits.delete(key)
    const key = createHmac('sha256', salt).update(identity).digest('hex')
    if (!limits.has(key) && limits.size >= 10000) return false
    const value = limits.get(key) ?? { count: 0, expires: now() + 60000 }
    value.count++; limits.set(key, value); return value.count <= maximum
  }
  return async (request: Request, ip: string) => {
    for (const [key, value] of sessions) if (value.expires <= now()) sessions.delete(key)
    const path = new URL(request.url).pathname
    const sessionId = request.headers.get('cookie')?.split(';').map(value => value.trim()).find(value => value.startsWith(`${name}=`))?.slice(name.length + 1)
    if (path === '/api/auth/session' && request.method === 'GET') {
      if (request.headers.get('sec-fetch-site') === 'cross-site') return response({ code: 'NOT_AVAILABLE' }, 403)
      // Separate read budget: normal status checks do not consume OTP attempts.
      if (!consume(`session-ip:${ip}`, 60)) return response({ code: 'RATE_LIMITED' }, 429)
      const session = sessionId ? sessions.get(sessionId) : undefined
      if (session && provider && sessionId) {
        try {
          if (await provider.validate(session.accessToken) !== session.userId) throw new Error('Session identity mismatch')
        } catch {
          sessions.delete(sessionId)
          return response({ enabled: Boolean(provider), signedIn: false, ...(challengeSiteKey ? { challengeSiteKey } : {}) }, 200, cookie('', 0))
        }
      }
      return response({ enabled: Boolean(provider), signedIn: Boolean(session && sessionId && sessions.get(sessionId) === session && session.expires > now()), ...(challengeSiteKey ? { challengeSiteKey } : {}) })
    }
    if (!['/api/auth/request', '/api/auth/verify', '/api/auth/logout'].includes(path) || request.method !== 'POST') return response({ code: 'NOT_AVAILABLE' }, 404)
    if (request.headers.get('origin') !== origin) return response({ code: 'NOT_AVAILABLE' }, 403)
    if (!consume(`ip:${ip}`)) return response({ code: 'RATE_LIMITED' }, 429)
    if (path === '/api/auth/logout') { if (sessionId) sessions.delete(sessionId); return response({ signedIn: false }, 200, cookie('', 0)) }
    if (!provider) return response({ code: 'UNAVAILABLE' }, 503)
    if (!request.headers.get('content-type')?.startsWith('application/json')) return response({ code: 'INVALID' }, 400)
    const raw = await request.text()
    if (Buffer.byteLength(raw) > (challengeSiteKey ? 4096 : 1024)) return response({ code: 'INVALID' }, 413)
    let parsed
    try { parsed = input.safeParse(JSON.parse(raw)) } catch { return response({ code: 'INVALID' }, 400) }
    if (!parsed.success || (path.endsWith('/verify') && !parsed.data.token) || (path.endsWith('/request') && parsed.data.token)) return response({ code: 'INVALID' }, 400)
    if (!consume(`email:${parsed.data.email.toLowerCase()}`)) return response({ code: 'RATE_LIMITED' }, 429)
    if (verifyChallenge && (!parsed.data.challengeToken || !await verifyChallenge(parsed.data.challengeToken, ip).catch(() => false))) return response({ code: 'CHALLENGE_REQUIRED' }, 403)
    if (path.endsWith('/request')) {
      // Same response for absent account/provider denial; do not disclose membership.
      await provider.request(parsed.data.email).catch(() => undefined)
      return response({ code: 'CHECK_EMAIL' })
    }
    try {
      const verified = await provider.verify(parsed.data.email, parsed.data.token!)
      if (sessions.size >= 10000) return response({ code: 'UNAVAILABLE' }, 503)
      const id = randomBytes(32).toString('hex')
      const age = Math.min(verified.expiresIn, 900)
      if (sessionId) sessions.delete(sessionId)
      sessions.set(id, { userId: verified.userId, accessToken: verified.accessToken, expires: now() + age * 1000 })
      return response({ signedIn: true }, 200, cookie(id, age))
    } catch { return response({ code: 'NOT_AVAILABLE' }, 401) }
  }
}
