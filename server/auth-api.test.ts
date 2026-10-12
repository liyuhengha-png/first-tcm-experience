// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { createAuthApi } from './auth-api'
const origin = 'https://demo.example.test'
const post = (path: string, body: unknown = {}, headers = {}) => new Request(origin + '/api/auth/' + path, { method: 'POST', headers: { origin, 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) })
const provider = () => ({ request: vi.fn(async () => undefined), validate: vi.fn(async () => 'synthetic-user-a'), verify: vi.fn(async () => ({ userId: 'synthetic-user-a', accessToken: 'private-fixture-token', expiresIn: 3600 })) })
describe('email auth session defenses', () => {
  it('clears a session when managed validation fails or returns a different user', async () => {
    for (const mismatch of [false, true]) {
      const managed = provider()
      const api = createAuthApi({ origin, provider: managed })
      const login = await api(post('verify', { email: 'a@example.test', token: '123456' }), 'login-ip')
      const cookieValue = login.headers.get('set-cookie')!.split(';')[0]
      if (mismatch) managed.validate.mockResolvedValue('synthetic-user-b')
      else managed.validate.mockRejectedValue(new Error('private provider details'))
      const status = await api(new Request(origin + '/api/auth/session', { headers: { cookie: cookieValue } }), 'read-ip')
      expect(await status.json()).toEqual({ enabled: true, signedIn: false })
      expect(status.headers.get('set-cookie')).toContain('Max-Age=0')
      expect(managed.validate).toHaveBeenCalledWith('private-fixture-token')
      managed.validate.mockResolvedValue('synthetic-user-a')
      const again = await api(new Request(origin + '/api/auth/session', { headers: { cookie: cookieValue } }), 'read-ip')
      expect((await again.json()).signedIn).toBe(false)
    }
  })
  it('requires a verified auth challenge before contacting the managed OTP provider', async () => {
    const managed = provider()
    const verifyChallenge = vi.fn(async () => false)
    expect(() => createAuthApi({ origin, challengeSiteKey: 'synthetic-site' })).toThrow('Incomplete')
    const api = createAuthApi({ origin, provider: managed, challengeSiteKey: 'synthetic-site', verifyChallenge })
    expect((await api(post('request', { email: 'a@example.test' }), 'missing-ip')).status).toBe(403)
    expect(managed.request).not.toHaveBeenCalled()
    expect((await api(post('verify', { email: 'a@example.test', token: '123456', challengeToken: 'invalid' }), 'invalid-ip')).status).toBe(403)
    expect(managed.verify).not.toHaveBeenCalled()
    verifyChallenge.mockRejectedValueOnce(new Error('private challenge detail'))
    const outage = await api(post('request', { email: 'a@example.test', challengeToken: 'outage' }), 'outage-ip')
    expect(outage.status).toBe(403); expect(await outage.text()).not.toContain('private')
    verifyChallenge.mockResolvedValue(true)
    expect((await api(post('request', { email: 'a@example.test', challengeToken: 'valid' }), 'valid-ip')).status).toBe(200)
    expect(managed.request).toHaveBeenCalledTimes(1)
    expect(verifyChallenge).toHaveBeenLastCalledWith('valid', 'valid-ip')
  })
  it('limits session probing separately from OTP and rejects cross-site status reads', async () => {
    let time = 0
    const managed = provider()
    const api = createAuthApi({ origin, provider: managed, now: () => time })
    const status = () => new Request(origin + '/api/auth/session')
    for (let i = 0; i < 60; i++) expect((await api(status(), 'probe-ip')).status).toBe(200)
    const blocked = await api(status(), 'probe-ip')
    expect(blocked.status).toBe(429)
    expect(blocked.headers.get('cache-control')).toBe('no-store')
    expect(await blocked.json()).toEqual({ code: 'RATE_LIMITED' })
    expect((await api(post('request', { email: 'a@example.test' }), 'probe-ip')).status).toBe(200)
    expect(managed.request).toHaveBeenCalledTimes(1)
    expect((await api(status(), 'other-ip')).status).toBe(200)
    expect((await api(new Request(origin + '/api/auth/session', { headers: { 'sec-fetch-site': 'cross-site' } }), 'cross-site-ip')).status).toBe(403)
    time = 60001
    expect((await api(status(), 'probe-ip')).status).toBe(200)
  })
  it('invalidates the previous session on replacement and invalidates the new one on logout', async () => {
    const api = createAuthApi({ origin, provider: provider() })
    const first = await api(post('verify', { email: 'a@example.test', token: '123456' }), 'first-ip')
    const oldCookie = first.headers.get('set-cookie')!.split(';')[0]
    const second = await api(post('verify', { email: 'a@example.test', token: '123456' }, { cookie: oldCookie }), 'second-ip')
    const newCookie = second.headers.get('set-cookie')!.split(';')[0]
    expect(newCookie).not.toBe(oldCookie)
    const status = async (cookie: string) => (await (await api(new Request(origin + '/api/auth/session', { headers: { cookie } }), 'ip')).json()).signedIn
    expect(await status(oldCookie)).toBe(false)
    expect(await status(newCookie)).toBe(true)
    await api(post('logout', {}, { cookie: newCookie }), 'logout-ip')
    expect(await status(newCookie)).toBe(false)
  })
  it('does not create a session for failed managed verification and rejects oversized requests', async () => {
    const managed = provider(); managed.verify.mockRejectedValue(new Error('private token details'))
    const api = createAuthApi({ origin, provider: managed })
    const result = await api(post('verify', { email: 'a@example.test', token: '123456' }), 'ip')
    expect(result.status).toBe(401); expect(result.headers.get('set-cookie')).toBeNull()
    expect(await result.text()).not.toContain('private token details')
    expect((await api(post('request', { email: 'x'.repeat(1100) }), 'other-ip')).status).toBe(413)
  })
  it('fails closed without mail configuration and rejects cross origin', async () => {
    const api = createAuthApi({ origin })
    expect((await api(post('request', { email: 'a@example.test' }), 'ip')).status).toBe(503)
    expect((await api(post('logout', {}, { origin: 'https://attacker.test' }), 'ip')).status).toBe(403)
  })
  it('does not enumerate provider failures or accept injected roles', async () => {
    const managed = provider(); managed.request.mockRejectedValue(new Error('private detail'))
    const api = createAuthApi({ origin, provider: managed })
    expect(await (await api(post('request', { email: 'a@example.test' }), 'ip')).json()).toEqual({ code: 'CHECK_EMAIL' })
    expect((await api(post('verify', { email: 'a@example.test', token: '123456', role: 'admin' }), 'ip')).status).toBe(400)
    expect(managed.verify).not.toHaveBeenCalled()
  })
  it('issues opaque private cookies, rotates sessions, expires and logs out without exposing tokens', async () => {
    let time = 0
    const api = createAuthApi({ origin, provider: provider(), now: () => time })
    const result = await api(post('verify', { email: 'a@example.test', token: '123456' }), 'ip')
    const header = result.headers.get('set-cookie')!
    expect(header).toContain('HttpOnly; SameSite=Strict'); expect(header).toContain('; Secure')
    expect(header).not.toContain('private-fixture-token'); expect(await result.text()).toBe('{"signedIn":true}')
    const cookie = header.split(';')[0]
    const get = () => new Request(origin + '/api/auth/session', { headers: { cookie } })
    expect(await (await api(get(), 'ip')).json()).toEqual({ enabled: true, signedIn: true })
    time = 900001
    expect((await (await api(get(), 'ip')).json()).signedIn).toBe(false)
    expect((await api(post('logout', {}, { cookie }), 'ip')).headers.get('set-cookie')).toContain('Max-Age=0')
  })
  it('bounds attempts and denies fabricated cookies', async () => {
    const api = createAuthApi({ origin, provider: provider() })
    for (let i = 0; i < 5; i++) await api(post('request', { email: 'a@example.test' }), 'ip')
    expect((await api(post('request', { email: 'a@example.test' }), 'ip')).status).toBe(429)
    expect((await (await api(new Request(origin + '/api/auth/session', { headers: { cookie: '__Host-tcm-session=fake' } }), 'ip')).json()).signedIn).toBe(false)
  })
})
