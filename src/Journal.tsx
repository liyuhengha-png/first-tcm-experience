import { useState } from 'react'
import type { Messages } from './i18n/en'
import { EmailLogin } from './EmailLogin'

// Fixed synthetic content only. No free-text health collection before KMS/readiness review.
export function Journal({ t }: { t: Messages }) {
  const [consent, setConsent] = useState(false)
  const [shown, setShown] = useState(false)
  return <section className="card">
    <h1>{t.journal}</h1><p>{t.journalNotice}</p>
    <EmailLogin t={t} />
    <h2 className="mt-6">{t.journalDemo}</h2><p>{t.journalDemoPrivacy}</p>
    <label><input type="checkbox" checked={consent} onChange={event => { setConsent(event.target.checked); if (!event.target.checked) setShown(false) }} /> {t.journalDemoConsent}</label>
    <div className="mt-4"><button type="button" disabled={!consent} onClick={() => setShown(true)}>{t.journalDemoOpen}</button></div>
    {shown && <article className="mt-4" aria-label={t.journalDemo}><h3>{t.selfReported}</h3><p>{t.journalSample}</p><button type="button" onClick={() => { setShown(false); setConsent(false) }}>{t.journalDemoClear}</button></article>}
    <p className="mt-4">{t.journalStorageGate}</p>
  </section>
}
