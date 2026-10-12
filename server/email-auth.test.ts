import { describe, expect, it, vi } from 'vitest'
import { emailAuth } from './email-auth'

describe('managed OTP adapter', () => {
  it('validates a managed user with a server header and rejects denial without exposing details', async () => {
    const userId = '00000000-0000-4000-8000-000000000001'
    const transport = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response(JSON.stringify({ id: userId }))).mockResolvedValueOnce(new Response('private details', { status: 401 }))
    const auth = emailAuth('https://synthetic.supabase.co', 'fixture', transport)
    expect(await auth.validate('synthetic-token')).toBe(userId)
    expect(String(transport.mock.calls[0][0])).toBe('https://synthetic.supabase.co/auth/v1/user')
    expect(transport.mock.calls[0][1]?.headers).toMatchObject({ Authorization: 'Bearer synthetic-token' })
    await expect(auth.validate('expired-token')).rejects.toThrow('Authentication unavailable')
  })
  it('allows managed registration only when explicitly enabled server-side', async () => {
    const transport = vi.fn<typeof fetch>().mockResolvedValue(new Response('{}'))
    await emailAuth('https://synthetic.supabase.co', 'sb_publishable_fixture', transport, true).request('demo@example.test')
    expect(JSON.parse(transport.mock.calls[0][1]!.body as string)).toEqual({ email: 'demo@example.test', create_user: true })
  })
  it('uses a publishable API key, existing accounts and POST bodies without URL tokens', async () => {
    const transport = vi.fn<typeof fetch>().mockResolvedValue(new Response('{}'))
    await emailAuth('https://synthetic.supabase.co', 'sb_publishable_fixture', transport).request('demo@example.test')
    const [url, options] = transport.mock.calls[0]
    expect(String(url)).toBe('https://synthetic.supabase.co/auth/v1/otp')
    expect(JSON.parse(options!.body as string)).toEqual({ email: 'demo@example.test', create_user: false })
    expect(options!.headers).not.toHaveProperty('Authorization')
  })
  it('validates managed session responses and rejects failures generically', async () => {
    const transport = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'synthetic-token', expires_in: 3600, user: { id: '00000000-0000-4000-8000-000000000001' } }))).mockResolvedValueOnce(new Response('private provider error', { status: 400 }))
    const auth = emailAuth('https://synthetic.supabase.co', 'sb_publishable_fixture', transport)
    expect((await auth.verify('demo@example.test', '123456')).userId).toBe('00000000-0000-4000-8000-000000000001')
    expect(String(transport.mock.calls[0][0])).not.toContain('123456')
    await expect(auth.verify('demo@example.test', '000000')).rejects.toThrow('Authentication unavailable')
  })
  it('fails closed for malformed sessions and non-HTTPS hosting', async () => {
    expect(() => emailAuth('http://synthetic.test', 'fixture')).toThrow()
    const transport = vi.fn<typeof fetch>().mockResolvedValue(new Response('{}'))
    await expect(emailAuth('https://synthetic.test', 'fixture', transport).verify('demo@example.test', '123456')).rejects.toThrow()
  })
})
