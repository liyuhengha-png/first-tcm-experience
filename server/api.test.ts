// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApi } from './api'
import { legalVersion, type BookingInput } from '../src/booking-schema'
import type { BookingStore } from './store'
const origin = 'http://127.0.0.1:4173'
export const validInput: BookingInput = { name: 'Synthetic Visitor', email: 'visitor@example.test', messenger: '', date: '2099-01-02', time: 'morning', guests: 1, serviceLanguage: 'en', uiLocale: 'en', terms: true, privacy: true, legalVersion, website: '', challengeToken: '' }
const request = (input: unknown, headers: Record<string, string> = {}) => new Request(origin + '/api/bookings', { method: 'POST', headers: { origin, 'content-type': 'application/json', ...headers }, body: JSON.stringify(input) })
describe('booking API defenses', () => {
  let store: BookingStore
  beforeEach(() => { store = { create: vi.fn<BookingStore['create']>(async (_input, _owner, reference) => ({ reference, status: 'REQUESTED', handling: 'MANUAL_PENDING' })), receipt: vi.fn<BookingStore['receipt']>(async () => ({ status: 'REQUESTED', handling: 'MANUAL_PENDING' })), verifyUser: vi.fn(async () => null) } })
  it('fails closed without persistence', async () => { const result = await createApi({ origin })(request(validInput), 'ip'); expect(result.status).toBe(503) })
  it('persists and returns only safe receipt after success, with no-store headers', async () => {
    const result = await createApi({ origin, store })(request(validInput), 'ip')
    expect(result.status).toBe(201); const body = await result.json()
    expect(Object.keys(body).sort()).toEqual(['handling', 'reference', 'status'])
    expect(body.reference).toMatch(/^[a-f0-9]{64}$/); expect(body.status).toBe('REQUESTED')
    expect(result.headers.get('cache-control')).toBe('no-store')
    expect(result.headers.get('content-security-policy')).toContain("frame-ancestors 'none'")
    expect(store.create).toHaveBeenCalledWith(validInput, null, body.reference)
  })
  it('rejects cross-origin, owner injection, unknown data, honeypot, consent/version and non-synthetic data', async () => {
    for (const [input, headers] of [[validInput, { origin: 'https://attacker.invalid' }], [{ ...validInput, owner_id: 'attacker' }, {}], [{ ...validInput, symptoms: 'synthetic' }, {}], [{ ...validInput, website: 'bot' }, {}], [{ ...validInput, terms: false }, {}], [{ ...validInput, legalVersion: 'old' }, {}], [{ ...validInput, email: 'synthetic@example.invalid' }, {}]] as const) {
      const response = await createApi({ origin, store })(request(input, headers), 'ip')
      expect(response.status).toBeGreaterThanOrEqual(400)
    }
    expect(store.create).not.toHaveBeenCalled()
  })
  it('limits suspicious traffic and then all submissions; resets after window', async () => {
    let now = 0; const api = createApi({ origin, store, now: () => now })
    const statuses = []
    for (let i = 0; i < 6; i++) statuses.push((await api(request(validInput), 'ip')).status)
    expect(statuses).toEqual([201, 201, 403, 403, 403, 429])
    now = 60001; expect((await api(request(validInput), 'ip')).status).toBe(201)
  })
  it('requires a real successful challenge when configured', async () => {
    const verifyChallenge = vi.fn(async () => false)
    const api = createApi({ origin, store, verifyChallenge })
    expect((await api(request({ ...validInput, challengeToken: 'invalid' }), 'ip')).status).toBe(403)
    expect(store.create).not.toHaveBeenCalled()
    verifyChallenge.mockResolvedValue(true)
    expect((await api(request({ ...validInput, challengeToken: 'verified' }), 'other-ip')).status).toBe(201)
  })
  it('rejects unverified auth and derives owner only from managed verification', async () => {
    const api = createApi({ origin, store })
    expect((await api(request(validInput, { authorization: 'Bearer invalid' }), 'ip')).status).toBe(401)
    vi.mocked(store.verifyUser).mockResolvedValue('00000000-0000-4000-8000-000000000001')
    expect((await api(request(validInput, { authorization: 'Bearer valid' }), 'other-ip')).status).toBe(201)
    expect(store.create).toHaveBeenLastCalledWith(validInput, '00000000-0000-4000-8000-000000000001', expect.any(String))
  })
  it('never announces receipt when persistence fails or returns storage error text', async () => {
    vi.mocked(store.create).mockRejectedValue(new Error('do not reveal credentials'))
    const response = await createApi({ origin, store })(request(validInput), 'ip')
    expect(response.status).toBe(503); expect(await response.text()).toBe('{"code":"UNAVAILABLE"}')
  })
  it('projects receipt fields and uniformly rejects absent/invalid references', async () => {
    const api = createApi({ origin, store })
    const good = await api(new Request(origin + '/api/receipts/' + 'a'.repeat(64)), 'ip')
    expect(await good.json()).toEqual({ status: 'REQUESTED', handling: 'MANUAL_PENDING' })
    vi.mocked(store.receipt).mockResolvedValue(null)
    for (const ref of ['a'.repeat(64), 'invalid']) { const result = await api(new Request(origin + '/api/receipts/' + ref), 'ip'); expect(result.status).toBe(404); expect(await result.json()).toEqual({ code: 'NOT_AVAILABLE' }) }
  })
  it('limits body size', async () => { expect((await createApi({ origin, store })(request({ ...validInput, messenger: 'a'.repeat(9000) }), 'ip')).status).toBe(413) })
})
