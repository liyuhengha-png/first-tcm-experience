import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { App } from './App'
import { dictionaries, preferenceKey } from './i18n'

beforeEach(() => vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ bookingEnabled: false, syntheticOnly: true, challengeSiteKey: null }) })))
afterEach(() => vi.unstubAllGlobals())
describe('bilingual scaffold', () => {
  it('has matching nonempty dictionary keys', () => {
    expect(Object.keys(dictionaries.en).sort()).toEqual(Object.keys(dictionaries['zh-CN']).sort())
    for (const dictionary of Object.values(dictionaries)) for (const value of Object.values(dictionary)) expect(value.trim()).not.toBe('')
  })
  for (const locale of ['en', 'zh-CN'] as const) for (const path of ['/', '/book', '/login', '/confirmation/synthetic-reference', '/journal', '/demo/solana', '/missing']) {
    it(`renders ${path} in ${locale} without health data entry`, async () => {
      localStorage.setItem(preferenceKey, locale)
      const { container } = render(<App path={path} />)
      expect(document.documentElement.lang).toBe(locale)
      expect(screen.getByRole('heading', { level: 1 })).toBeVisible()
      expect(screen.getByText(dictionaries[locale].privacy)).toBeVisible()
      if (path === '/journal' || path === '/login') { expect(container.querySelector('textarea')).toBeNull(); await waitFor(() => expect(screen.getByRole('button', { name: dictionaries[locale].authSend })).toBeDisabled()) }
      else if (path !== '/book') expect(container.querySelector('input:not([type="checkbox"]), textarea, form')).toBeNull()
      else await waitFor(() => expect(screen.getByRole('button', { name: dictionaries[locale].submit })).toBeDisabled())
    })
  }
  it('defaults to English, switches in place, and only stores locale', () => {
    render(<App path="/journal" />)
    expect(document.documentElement.lang).toBe('en')
    fireEvent.click(screen.getByRole('button', { name: '中文' }))
    expect(document.documentElement.lang).toBe('zh-CN')
    expect(screen.getByText(dictionaries['zh-CN'].journalNotice)).toBeVisible()
    expect(localStorage.length).toBe(1)
    expect(localStorage.getItem(preferenceKey)).toBe('zh-CN')
    fireEvent.click(screen.getByRole('button', { name: 'English' }))
    expect(document.documentElement.lang).toBe('en')
  })
  it('does not reflect a confirmation reference into the receipt', () => {
    render(<App path="/confirmation/private-marker" />)
    expect(document.body.textContent).not.toContain('private-marker')
    expect(screen.getByText(dictionaries.en.receiptMissing)).toBeVisible()
  })
  it('preserves demo consent and view on locale switch without network or health storage', () => {
    render(<App path="/journal" />)
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: dictionaries.en.journalDemoOpen }))
    fireEvent.click(screen.getByRole('button', { name: '中文' }))
    expect(screen.getByRole('checkbox')).toBeChecked()
    expect(screen.getByText(dictionaries['zh-CN'].journalSample)).toBeVisible()
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe('/api/auth/session')
    expect(localStorage.length).toBe(1)
    expect(sessionStorage.length).toBe(0)
    fireEvent.click(screen.getByRole('button', { name: dictionaries['zh-CN'].journalDemoClear }))
    expect(screen.queryByText(dictionaries['zh-CN'].journalSample)).not.toBeInTheDocument()
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })
})
