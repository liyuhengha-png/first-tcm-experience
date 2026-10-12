import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
import { createApi, securityHeaders } from './api'
import { supabaseStore } from './store'
import { openSyntheticDatabase } from './local-store'
import { createAuthApi } from './auth-api'
import { emailAuth } from './email-auth'

const port = Number(process.env.PORT ?? 4173)
const origin = process.env.APP_ORIGIN ?? `http://127.0.0.1:${port}`
const localMode = process.env.SYNTHETIC_LOCAL_DB === 'true'
const syntheticOnly = process.env.ALLOW_REAL_BOOKING_DATA !== 'true'
if (localMode && !syntheticOnly) throw new Error('Local database only allows synthetic data')
const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
const secret = process.env.TURNSTILE_SECRET_KEY
const siteKey = process.env.TURNSTILE_SITE_KEY
if (Boolean(secret) !== Boolean(siteKey)) throw new Error('Turnstile requires both site and server secret keys; incomplete configuration is denied')
if (!syntheticOnly) throw new Error('Real booking data disabled until reviewed legal copy, hosting, retention and operational controls are implemented')
const local = localMode ? await openSyntheticDatabase(resolve('.local-data/booking')) : undefined
const store = local?.store ?? (url && key ? supabaseStore(url, key) : undefined)
const api = createApi({ origin, store, syntheticOnly, challengeSiteKey: siteKey,
  verifyChallenge: secret && siteKey ? async (token, ip) => {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: new URLSearchParams({ secret, response: token, remoteip: ip }), signal: AbortSignal.timeout(8000) })
    if (!response.ok) return false
    const result = await response.json()
    return result.success === true && result.hostname === new URL(origin).hostname && result.action === 'booking'
  } : undefined,
})
const root = resolve('dist')
// Founder-controlled local email test only; public launch still needs CAPTCHA/privacy review.
const emailTest = process.env.AUTH_EMAIL_TEST_ENABLED === 'true'
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY
if (emailTest && (!url || !publishableKey || !['127.0.0.1', 'localhost'].includes(new URL(origin).hostname))) throw new Error('Email test requires managed configuration and a loopback origin')
const authApi = createAuthApi({ origin, provider: emailTest ? emailAuth(url!, publishableKey!, fetch, true) : undefined,
  challengeSiteKey: siteKey,
  verifyChallenge: secret && siteKey ? async (token, ip) => {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: new URLSearchParams({ secret, response: token, remoteip: ip }), signal: AbortSignal.timeout(8000) })
    if (!response.ok) return false
    const result = await response.json()
    return result.success === true && result.hostname === new URL(origin).hostname && result.action === 'auth'
  } : undefined,
})
const server = createServer(async (req, res) => {
  const headers: Record<string, string> = { ...securityHeaders }
  if (origin.startsWith('https:')) headers['Strict-Transport-Security'] = 'max-age=31536000'
  function finish(status: number, body: string | Buffer, extra: Record<string, string> = {}) { res.writeHead(status, { ...headers, ...extra }); res.end(body) }
  try {
    const path = new URL(req.url ?? '/', origin).pathname
    if (path === '/demo/solana') headers['Content-Security-Policy'] = headers['Content-Security-Policy'].replace("connect-src 'self'", "connect-src 'self' https://api.devnet.solana.com")
    if (path.startsWith('/api/')) {
      const chunks: Buffer[] = []; let size = 0
      for await (const chunk of req) { size += chunk.length; if (size > 8192) { finish(413, '{"code":"INVALID"}', { 'Content-Type': 'application/json' }); return } chunks.push(chunk) }
      const requestHeaders = new Headers()
      for (const [name, value] of Object.entries(req.headers)) if (typeof value === 'string') requestHeaders.set(name, value)
      const request = new Request(new URL(req.url ?? '/', origin), { method: req.method, headers: requestHeaders, ...((req.method !== 'GET' && req.method !== 'HEAD') ? { body: Buffer.concat(chunks).toString('utf8') } : {}) })
      // Ignore spoofable X-Forwarded-For. Distributed/reverse-proxy deployment needs reviewed WAF + shared limits.
      const response = await (path.startsWith('/api/auth/') ? authApi : api)(request, req.socket.remoteAddress ?? 'unknown')
      finish(response.status, await response.text(), Object.fromEntries(response.headers)); return
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') { finish(405, ''); return }
    const file = resolve(root, '.' + decodeURIComponent(path))
    if (file !== root && !file.startsWith(root + sep)) { finish(404, ''); return }
    let target = file
    if (!(await stat(target).catch(() => null))?.isFile()) {
      if (extname(path)) { finish(404, ''); return }
      target = resolve(root, 'index.html')
    }
    const types: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' }
    finish(200, req.method === 'HEAD' ? '' : await readFile(target), { 'Content-Type': types[extname(target)] ?? 'application/octet-stream' })
  } catch { finish(503, '{"code":"UNAVAILABLE"}', { 'Content-Type': 'application/json' }) }
})
server.requestTimeout = 10000
server.headersTimeout = 10000
server.listen(port, '127.0.0.1', () => console.info(`First TCM local preview: ${origin}; mode=${localMode ? 'synthetic-local-postgres' : store ? 'supabase' : 'disabled'}`))
async function shutdown() { server.close(); await local?.db.close(); process.exit(0) }
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown)
