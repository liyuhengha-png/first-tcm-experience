// Explicit live synthetic integration test. Credentials stay in memory; no cleanup deletion.
import { randomBytes } from 'node:crypto'
import { createApi } from './api'
import { supabaseStore } from './store'
import { emptyDraft } from '../src/booking-schema'
const base = process.env.SUPABASE_URL
const secret = process.env.SUPABASE_SECRET_KEY
const publishable = process.env.SUPABASE_PUBLISHABLE_KEY
if (!base || !secret || !publishable?.startsWith('sb_publishable_')) throw new Error('Required test configuration missing')
const origin = 'http://127.0.0.1:4173'
const store = supabaseStore(base, secret)
const api = createApi({ origin, store, syntheticOnly: true })
async function call(path: string, key: string, token?: string, body?: unknown, method?: string) {
  const response = await fetch(new URL(path, base), { method: method ?? (body ? 'POST' : 'GET'), headers: { apikey: key, ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(12000) })
  let data: unknown = null
  try { data = await response.json() } catch { /* No raw response logs. */ }
  return { status: response.status, data }
}
function assert(ok: unknown, label: string): asserts ok { if (!ok) throw new Error(label) }
type User = { id: string; token: string; reference: string }
async function makeUser(locale: 'en' | 'zh-CN'): Promise<User> {
  const email = `synthetic-${randomBytes(8).toString('hex')}@example.test`
  const password = randomBytes(32).toString('base64url')
  const admin = await call('/auth/v1/admin/users', secret!, undefined, { email, password, email_confirm: true })
  const created = admin.data as { id?: string } | null
  assert(admin.status >= 200 && admin.status < 300 && created?.id, 'Synthetic auth user creation failed')
  const login = await call('/auth/v1/token?grant_type=password', publishable!, undefined, { email, password })
  const session = login.data as { access_token?: string; user?: { id: string } } | null
  assert(login.status === 200 && session?.access_token && session.user?.id === created.id, 'Managed auth login failed')
  const input = { ...emptyDraft(), name: 'Synthetic Isolation Visitor', email, date: '2099-01-02', terms: true, privacy: true, uiLocale: locale }
  const request = new Request(origin + '/api/bookings', { method: 'POST', headers: { origin, 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify(input) })
  const booking = await api(request, 'synthetic-' + locale)
  const receipt = await booking.json()
  assert(booking.status === 201 && receipt.status === 'REQUESTED', 'Authenticated booking persistence failed')
  return { id: created.id, token: session.access_token, reference: receipt.reference }
}
async function checkOwn(user: User, other: User) {
  const own = await call('/rest/v1/bookings?select=id,owner_id,ui_locale', publishable!, user.token)
  const rows = own.data as { owner_id: string }[]
  assert(own.status === 200 && Array.isArray(rows) && rows.length === 1 && rows[0].owner_id === user.id, 'Own-only booking read failed')
  const foreign = await call(`/rest/v1/bookings?select=id&owner_id=eq.${other.id}`, publishable!, user.token)
  assert(foreign.status === 200 && Array.isArray(foreign.data) && foreign.data.length === 0, 'Cross-user booking isolation failed')
  const consents = await call('/rest/v1/consent_events?select=owner_id,purpose,locale', publishable!, user.token)
  const consentRows = consents.data as { owner_id: string }[]
  assert(consents.status === 200 && Array.isArray(consentRows) && consentRows.length === 2 && consentRows.every(row => row.owner_id === user.id), 'Consent ownership isolation failed')
  const write = await call(`/rest/v1/bookings?owner_id=eq.${other.id}`, publishable!, user.token, { contact_name: 'Synthetic Unauthorized Attempt' }, 'PATCH')
  assert(write.status === 401 || write.status === 403, 'Unauthorized write not rejected')
  for (const table of ['booking_receipts', 'audit_events']) {
    const denied = await call(`/rest/v1/${table}?select=*`, publishable!, user.token)
    assert(denied.status === 401 || denied.status === 403, 'Private table read not rejected')
  }
  const privileged = await call('/rest/v1/rpc/read_booking_receipt', publishable!, user.token, { p_reference: other.reference })
  assert(privileged.status === 401 || privileged.status === 403, 'Privileged receipt RPC not rejected')
}
try {
  const a = await makeUser('en'); const b = await makeUser('zh-CN')
  await checkOwn(a, b); await checkOwn(b, a)
  const anonymous = await call('/rest/v1/bookings?select=id', publishable)
  assert(anonymous.status === 401 || anonymous.status === 403, 'Anonymous booking read not rejected')
  console.info(JSON.stringify({ managedAuth: true, twoUserBookingIsolation: true, consentIsolation: true, unauthorizedWritesDenied: true, privateTablesDenied: true, privilegedRpcDenied: true, anonymousReadDenied: true, locales: ['en', 'zh-CN'], syntheticUsersRetained: 2, passed: true }))
} catch (error) {
  console.info(JSON.stringify({ passed: false, stage: error instanceof Error ? error.message : 'Integration failed' }))
  process.exitCode = 1
}
