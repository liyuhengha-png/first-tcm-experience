import { Challenge } from './Challenge'
import { useEffect, useRef, useState } from 'react'
import { bookingSchema, emptyDraft, legalVersion, type BookingDraft } from './booking-schema'
import type { Locale } from './i18n'
import type { Messages } from './i18n/en'

type Config = { bookingEnabled: boolean; syntheticOnly: boolean; challengeSiteKey: string | null }
export function Booking({ t, locale, onReceipt }: { t: Messages; locale: Locale; onReceipt: (reference: string) => void }) {
  const [draft, setDraft] = useState<BookingDraft>(emptyDraft)
  const [config, setConfig] = useState<Config | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [challengeReset, setChallengeReset] = useState(0)
  const lock = useRef(false)
  const [error, setError] = useState<keyof Messages | null>(null)
  useEffect(() => {
    const abort = new AbortController()
    fetch('/api/config', { signal: abort.signal, cache: 'no-store' }).then(response => response.ok ? response.json() : null).then(value => { if (!abort.signal.aborted) { setConfig(value); setLoaded(true) } }).catch(() => { if (!abort.signal.aborted) setLoaded(true) })
    return () => abort.abort()
  }, [])
  function field<Key extends keyof BookingDraft>(key: Key, value: BookingDraft[Key]) { setDraft(previous => ({ ...previous, [key]: value })) }
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (lock.current || !config?.bookingEnabled) return
    const parsed = bookingSchema.safeParse({ ...draft, uiLocale: locale })
    if (!parsed.success) { setError('invalid'); return }
    if (config.syntheticOnly && !/^[^@]+@example\.test$/.test(draft.email)) { setError('syntheticError'); return }
    lock.current = true; setBusy(true); setError(null)
    try {
      const response = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed.data), cache: 'no-store' })
      const result = await response.json()
      if (response.status === 201 && result.status === 'REQUESTED' && /^[a-f0-9]{64}$/.test(result.reference)) { onReceipt(result.reference); return }
      setError(result.code === 'RATE_LIMITED' ? 'rateLimited' : result.code === 'CHALLENGE_REQUIRED' ? 'challengeRequired' : result.code === 'SYNTHETIC_ONLY' ? 'syntheticError' : result.code === 'INVALID' ? 'invalid' : 'submitError')
    } catch { setError('submitError') }
    finally { lock.current = false; setBusy(false); field('challengeToken', ''); setChallengeReset(value => value + 1) }
  }
  const disabled = !config?.bookingEnabled || busy
  return <section className="card"><h1>{t.book}</h1><p>{t.bookNotice}</p>
    <p role="status" className="notice">{!loaded ? t.configLoading : !config?.bookingEnabled ? t.serviceOffline : config.syntheticOnly ? t.syntheticNotice : t.provisional}</p>
    <form onSubmit={submit} noValidate>
      <fieldset disabled={disabled} className="grid gap-5"><legend className="sr-only">{t.book}</legend>
        <label>{t.name}<input autoComplete="off" maxLength={80} value={draft.name} onChange={event => field('name', event.target.value)} required /></label>
        <label>{t.email}<input type="email" autoComplete="off" maxLength={254} value={draft.email} onChange={event => field('email', event.target.value)} required /></label>
        <label>{t.messenger}<input autoComplete="off" maxLength={100} value={draft.messenger} onChange={event => field('messenger', event.target.value)} /></label>
        <div className="grid gap-5 md:grid-cols-2"><label>{t.date}<input type="date" value={draft.date} onInput={event => field('date', event.currentTarget.value)} onChange={event => field('date', event.target.value)} required /></label>
          <label>{t.time}<select value={draft.time} onChange={event => field('time', event.target.value as BookingDraft['time'])}><option value="morning">{t.morning}</option><option value="afternoon">{t.afternoon}</option></select></label></div>
        <div className="grid gap-5 md:grid-cols-2"><label>{t.guests}<input type="number" min={1} max={6} value={draft.guests} onChange={event => field('guests', Number(event.target.value))} required /></label>
          <label>{t.serviceLanguage}<select value={draft.serviceLanguage} onChange={event => field('serviceLanguage', event.target.value as Locale)}><option value="en">{t.englishService}</option><option value="zh-CN">{t.chineseService}</option></select></label></div>
        <div className="honeypot" aria-hidden="true"><label>{t.honeypot}<input tabIndex={-1} autoComplete="off" value={draft.website} onChange={event => field('website', event.target.value)} /></label></div>
        <section><h2>{t.termsTitle}</h2><p>{t.termsCopy}</p><p className="eyebrow">{t.legalDraft} {legalVersion}</p><label className="checkbox"><input type="checkbox" checked={draft.terms} onChange={event => field('terms', event.target.checked)} />{t.acceptTerms}</label></section>
        <section><h2>{t.privacyNoticeTitle}</h2><p>{t.privacyCopy}</p><p className="eyebrow">{t.legalDraft} {legalVersion}</p><label className="checkbox"><input type="checkbox" checked={draft.privacy} onChange={event => field('privacy', event.target.checked)} />{t.acceptPrivacy}</label></section>
      </fieldset>
      {config?.challengeSiteKey && <div aria-label={t.challengeLabel}><Challenge key={challengeReset} siteKey={config.challengeSiteKey} locale={locale} onToken={token => field('challengeToken', token)} /></div>}
      {error && <p role="alert" className="error">{t[error]}</p>}
      <button className="primary mt-6" type="submit" disabled={disabled}>{busy ? t.submitting : t.submit}</button>
    </form>
  </section>
}
export function Receipt({ reference, t }: { reference: string; t: Messages }) {
  const [status, setStatus] = useState<'loading' | 'missing' | 'REQUESTED' | 'CONFIRMED' | 'CANCELLED'>('loading')
  useEffect(() => {
    const abort = new AbortController()
    if (!/^[a-f0-9]{64}$/.test(reference)) return
    fetch(`/api/receipts/${reference}`, { cache: 'no-store', signal: abort.signal }).then(response => response.ok ? response.json() : null).then(result => { if (!abort.signal.aborted) setStatus(result && ['REQUESTED', 'CONFIRMED', 'CANCELLED'].includes(result.status) ? result.status : 'missing') }).catch(() => { if (!abort.signal.aborted) setStatus('missing') })
    return () => abort.abort()
  }, [reference])
  const message = !/^[a-f0-9]{64}$/.test(reference) ? t.receiptMissing : status === 'loading' ? t.receiptLoading : status === 'REQUESTED' ? t.received : status === 'CONFIRMED' ? t.confirmedState : status === 'CANCELLED' ? t.cancelledState : t.receiptMissing
  return <section className="card"><h1>{t.confirmation}</h1><p role="status">{message}</p>{status === 'REQUESTED' && <p>{t.pending}</p>}<p className="mt-4">{t.receiptPrivacy}</p><a className="inline-block mt-6 underline" href="/demo/solana">{t.solana}</a></section>
}
