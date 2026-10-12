// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest'
import { supabaseStore } from './store'
afterEach(() => vi.unstubAllGlobals())
it('uses modern secret only in apikey and keeps user authorization separate', async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: '00000000-0000-4000-8000-000000000001' }) })
  vi.stubGlobal('fetch', fetchMock)
  const store = supabaseStore('https://synthetic.supabase.co', 'sb_secret_SYNTHETIC_NOT_REAL')
  await store.receipt('a'.repeat(64))
  expect(fetchMock.mock.calls[0][1].headers).toEqual({ apikey: 'sb_secret_SYNTHETIC_NOT_REAL', 'Content-Type': 'application/json' })
  await store.verifyUser('synthetic-user-jwt')
  expect(fetchMock.mock.calls[1][1].headers).toEqual({ apikey: 'sb_secret_SYNTHETIC_NOT_REAL', Authorization: 'Bearer synthetic-user-jwt' })
})
it('retains legacy service role JWT compatibility', async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => null })
  vi.stubGlobal('fetch', fetchMock)
  await supabaseStore('https://synthetic.supabase.co', 'synthetic-legacy-jwt').receipt('a'.repeat(64))
  expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer synthetic-legacy-jwt')
})
