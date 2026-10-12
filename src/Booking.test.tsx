import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { App } from './App'
import { dictionaries, preferenceKey } from './i18n'
import { legalVersion } from './booking-schema'
const reference = 'a'.repeat(64)
let requests: { url: string; options?: RequestInit }[]
beforeEach(() => {
  requests = []
  vi.stubGlobal('fetch', vi.fn(async (url: string, options?: RequestInit) => {
    requests.push({ url, options })
    return { ok: true, status: url === '/api/bookings' ? 201 : 200, json: async () => url === '/api/config' ? { bookingEnabled: true, syntheticOnly: true, challengeSiteKey: null } : { reference, status: 'REQUESTED', handling: 'MANUAL_PENDING' } }
  }))
})
afterEach(() => { vi.unstubAllGlobals(); window.history.replaceState({}, '', '/') })
async function ready(locale: 'en' | 'zh-CN' = 'en') {
  localStorage.setItem(preferenceKey, locale)
  render(<App path="/book" />)
  await waitFor(() => expect(screen.getByRole('button', { name: dictionaries[locale].submit })).toBeEnabled())
}
function fill(locale: 'en' | 'zh-CN') {
  const t = dictionaries[locale]
  fireEvent.change(screen.getByLabelText(t.name), { target: { value: 'Synthetic Visitor' } })
  fireEvent.change(screen.getByLabelText(t.email), { target: { value: 'visitor@example.test' } })
  fireEvent.change(screen.getByLabelText(t.date), { target: { value: '2099-01-02' } })
  fireEvent.click(screen.getByLabelText(t.acceptTerms)); fireEvent.click(screen.getByLabelText(t.acceptPrivacy))
}
it('switch preserves booking draft, requested service language and affirmative consent without submitting', async () => {
  await ready(); fill('en')
  fireEvent.change(screen.getByLabelText(dictionaries.en.serviceLanguage), { target: { value: 'zh-CN' } })
  fireEvent.click(screen.getByRole('button', { name: '中文' }))
  expect(screen.getByLabelText(dictionaries['zh-CN'].name)).toHaveValue('Synthetic Visitor')
  expect(screen.getByLabelText(dictionaries['zh-CN'].date)).toHaveValue('2099-01-02')
  expect(screen.getByLabelText(dictionaries['zh-CN'].serviceLanguage)).toHaveValue('zh-CN')
  expect(screen.getByLabelText(dictionaries['zh-CN'].acceptTerms)).toBeChecked()
  expect(requests.filter(item => item.url === '/api/bookings')).toHaveLength(0)
  expect(localStorage.length).toBe(1); expect(localStorage.getItem(preferenceKey)).toBe('zh-CN')
})
it('retains native date input events across an unrelated update and locale switch', async () => {
  await ready()
  fireEvent.input(screen.getByLabelText(dictionaries.en.date), { target: { value: '2099-01-02' } })
  fireEvent.click(screen.getByLabelText(dictionaries.en.acceptTerms))
  fireEvent.click(screen.getByRole('button', { name: '中文' }))
  expect(screen.getByLabelText(dictionaries['zh-CN'].date)).toHaveValue('2099-01-02')
})
it('refreshes anti-bot verification after a failed attempt', async () => {
  let latestCallback: ((token: string) => void) | undefined
  const renderWidget = vi.fn((_element: HTMLElement, options: { callback: (token: string) => void }) => { latestCallback = options.callback; return 'synthetic-widget' })
  vi.stubGlobal('turnstile', { render: renderWidget, remove: vi.fn(), reset: vi.fn() })
  vi.stubGlobal('fetch', vi.fn(async (url: string) => ({ ok: url === '/api/config', status: url === '/api/config' ? 200 : 403, json: async () => url === '/api/config' ? { bookingEnabled: true, syntheticOnly: true, challengeSiteKey: 'synthetic-site-key' } : { code: 'CHALLENGE_REQUIRED' } })))
  await ready(); fill('en')
  const callsBefore = renderWidget.mock.calls.length
  latestCallback?.('synthetic-token')
  fireEvent.click(screen.getByRole('button', { name: dictionaries.en.submit }))
  await screen.findByText(dictionaries.en.challengeRequired)
  await waitFor(() => expect(renderWidget.mock.calls.length).toBeGreaterThan(callsBefore))
  expect(screen.getByLabelText(dictionaries.en.name)).toHaveValue('Synthetic Visitor')
})
for (const locale of ['en', 'zh-CN'] as const) {
  it(`localizes validation and starts without consent in ${locale}`, async () => {
    await ready(locale)
    const t = dictionaries[locale]
    expect(screen.getByLabelText(t.acceptTerms)).not.toBeChecked()
    expect(screen.getByLabelText(t.acceptPrivacy)).not.toBeChecked()
    fireEvent.click(screen.getByRole('button', { name: t.submit }))
    expect(screen.getByRole('alert')).toHaveTextContent(t.invalid)
    expect(requests.filter(item => item.url === '/api/bookings')).toHaveLength(0)
  })
  it(`submits canonical locale/version once and shows safe REQUESTED receipt in ${locale}`, async () => {
    await ready(locale); fill(locale)
    const button = screen.getByRole('button', { name: dictionaries[locale].submit })
    fireEvent.click(button); fireEvent.click(button)
    await screen.findByText(dictionaries[locale].received)
    const submissions = requests.filter(item => item.url === '/api/bookings')
    expect(submissions).toHaveLength(1)
    expect(JSON.parse(submissions[0].options?.body as string)).toMatchObject({ uiLocale: locale, serviceLanguage: 'en', legalVersion, terms: true, privacy: true })
    expect(window.location.pathname).toBe(`/confirmation/${reference}`)
    expect(window.location.href).not.toContain('visitor')
    expect(document.body.textContent).not.toContain('visitor@example.test')
    expect(screen.getByText(dictionaries[locale].pending)).toBeVisible()
  })
}
