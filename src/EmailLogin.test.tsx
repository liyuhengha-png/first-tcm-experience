import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EmailLogin } from './EmailLogin'
import { dictionaries } from './i18n'
afterEach(() => { vi.unstubAllGlobals(); delete window.turnstile })
describe('bilingual email sign-in', () => {
  for (const locale of ['en', 'zh-CN'] as const) it(`requires a fresh challenge before sending OTP in ${locale}`, async () => {
    const t = dictionaries[locale]
    const renderChallenge = vi.fn(() => 'synthetic-widget')
    window.turnstile = { render: renderChallenge, remove: vi.fn(), reset: vi.fn() }
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ enabled: true, signedIn: false, challengeSiteKey: 'synthetic-site' }) })
    vi.stubGlobal('fetch', fetcher)
    render(<EmailLogin t={t} locale={locale} />)
    await waitFor(() => expect(screen.getByRole('button', { name: t.authSend })).toBeEnabled())
    fireEvent.change(screen.getByLabelText(t.email), { target: { value: 'synthetic@example.test' } })
    fireEvent.click(screen.getByRole('button', { name: t.authSend }))
    expect(await screen.findByText(t.challengeRequired)).toBeVisible()
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(renderChallenge).toHaveBeenCalledWith(expect.any(HTMLElement), expect.objectContaining({ action: 'auth', language: locale === 'zh-CN' ? 'zh-cn' : 'en' }))
  })
  for (const locale of ['en', 'zh-CN'] as const) it(`requests, verifies, clears credentials and signs out in ${locale}`, async () => {
    const t = dictionaries[locale]
    const fetcher = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ enabled: true, signedIn: false }) }).mockResolvedValueOnce({ ok: true, json: async () => ({ code: 'CHECK_EMAIL' }) }).mockResolvedValueOnce({ ok: true, json: async () => ({ signedIn: true }) }).mockResolvedValueOnce({ ok: true, json: async () => ({ signedIn: false }) })
    vi.stubGlobal('fetch', fetcher)
    render(<EmailLogin t={t} />)
    await waitFor(() => expect(screen.getByRole('button', { name: t.authSend })).toBeEnabled())
    fireEvent.change(screen.getByLabelText(t.email), { target: { value: 'synthetic@example.test' } })
    fireEvent.click(screen.getByRole('button', { name: t.authSend }))
    await screen.findByText(t.authSent)
    fireEvent.change(screen.getByLabelText(t.authCode), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: t.authVerify }))
    await screen.findByText(t.authSignedIn)
    expect(fetcher.mock.calls[2][0]).toBe('/api/auth/verify')
    expect(JSON.parse(fetcher.mock.calls[2][1].body)).toEqual({ email: 'synthetic@example.test', token: '123456' })
    expect(localStorage.length).toBe(0); expect(sessionStorage.length).toBe(0)
    fireEvent.click(screen.getByRole('button', { name: t.authLogout }))
    await waitFor(() => expect(screen.getByLabelText(t.email)).toHaveValue(''))
  })
  it('preserves email and code on language change without resubmission and clears failed codes', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ enabled: true }) }).mockResolvedValueOnce({ ok: true, json: async () => ({ code: 'CHECK_EMAIL' }) }).mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ code: 'NOT_AVAILABLE' }) })
    vi.stubGlobal('fetch', fetcher)
    const { rerender } = render(<EmailLogin t={dictionaries.en} />)
    await waitFor(() => expect(screen.getByRole('button', { name: dictionaries.en.authSend })).toBeEnabled())
    fireEvent.change(screen.getByLabelText(dictionaries.en.email), { target: { value: 'synthetic@example.test' } })
    fireEvent.click(screen.getByRole('button', { name: dictionaries.en.authSend }))
    await screen.findByText(dictionaries.en.authSent)
    fireEvent.change(screen.getByLabelText(dictionaries.en.authCode), { target: { value: '123456' } })
    rerender(<EmailLogin t={dictionaries['zh-CN']} />)
    expect(screen.getByLabelText(dictionaries['zh-CN'].authCode)).toHaveValue('123456')
    expect(screen.getByLabelText(dictionaries['zh-CN'].email)).toHaveValue('synthetic@example.test')
    expect(fetcher).toHaveBeenCalledTimes(2)
    fireEvent.click(screen.getByRole('button', { name: dictionaries['zh-CN'].authVerify }))
    await screen.findByText(dictionaries['zh-CN'].authError)
    expect(screen.getByLabelText(dictionaries['zh-CN'].authCode)).toHaveValue('')
  })
})
