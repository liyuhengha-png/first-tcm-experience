import { useEffect, useRef, useState } from 'react'
import type { Messages } from './i18n/en'
import type { Locale } from './i18n'
import { Challenge } from './Challenge'

export function EmailLogin({ t, locale = 'en' }: { t: Messages; locale?: Locale }) {
  const [challengeSiteKey, setChallengeSiteKey] = useState<string | null>(null)
  const [challengeToken, setChallengeToken] = useState('')
  const [challengeReset, setChallengeReset] = useState(0)
  const [enabled, setEnabled] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<'authSent' | 'authError' | 'rateLimited' | 'challengeRequired' | null>(null)
  const lock = useRef(false)
  useEffect(() => {
    const abort = new AbortController()
    fetch('/api/auth/session', { cache: 'no-store', credentials: 'same-origin', signal: abort.signal })
      .then(response => response.ok ? response.json() : null)
      .then(result => { if (!abort.signal.aborted) { setEnabled(result?.enabled === true); setSignedIn(result?.signedIn === true); setChallengeSiteKey(typeof result?.challengeSiteKey === 'string' ? result.challengeSiteKey : null) } })
      .catch(() => { if (!abort.signal.aborted) setEnabled(false) })
    return () => abort.abort()
  }, [])
  async function submit(action: 'request' | 'verify' | 'logout') {
    if (lock.current || (!enabled && action !== 'logout')) return
    if (action !== 'logout' && challengeSiteKey && !challengeToken) { setMessage('challengeRequired'); return }
    lock.current = true; setBusy(true); setMessage(null)
    try {
      const response = await fetch(`/api/auth/${action}`, { method: 'POST', credentials: 'same-origin', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(action === 'logout' ? {} : { email, ...(action === 'verify' ? { token } : {}), ...(challengeSiteKey ? { challengeToken } : {}) }) })
      const result = await response.json()
      if (!response.ok) { setMessage(response.status === 429 ? 'rateLimited' : result.code === 'CHALLENGE_REQUIRED' ? 'challengeRequired' : 'authError'); return }
      if (action === 'request' && result.code === 'CHECK_EMAIL') { setSent(true); setMessage('authSent') }
      else if (action === 'verify' && result.signedIn === true) { setSignedIn(true); setEmail(''); setToken(''); setSent(false) }
      else if (action === 'logout' && result.signedIn === false) { setSignedIn(false); setSent(false); setToken(''); setEmail('') }
      else setMessage('authError')
    } catch { setMessage('authError') }
    finally { if (action === 'verify') setToken(''); setChallengeToken(''); setChallengeReset(value => value + 1); lock.current = false; setBusy(false) }
  }
  return <section aria-label={t.emailLogin}>
    <h2>{t.emailLogin}</h2>
    {!enabled && <p>{t.emailLoginGate}</p>}
    {signedIn ? <><p role="status">{t.authSignedIn}</p><button disabled={busy} type="button" onClick={() => void submit('logout')}>{t.authLogout}</button></> : <form onSubmit={event => { event.preventDefault(); void submit(sent ? 'verify' : 'request') }}>
      <fieldset disabled={!enabled || busy}>
        <label>{t.email}<input type="email" autoComplete="email" maxLength={254} required value={email} readOnly={sent} onChange={event => setEmail(event.target.value)} /></label>
        {sent && <label>{t.authCode}<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" minLength={6} maxLength={10} required value={token} onChange={event => setToken(event.target.value)} /></label>}
        {challengeSiteKey && <div aria-label={t.authChallengeLabel}><Challenge key={challengeReset} siteKey={challengeSiteKey} locale={locale} action="auth" onToken={setChallengeToken} /></div>}
        <button type="submit" className="mt-4">{busy ? t.authBusy : sent ? t.authVerify : t.authSend}</button>
        {sent && <button type="button" onClick={() => { setSent(false); setToken(''); setMessage(null) }}>{t.authChangeEmail}</button>}
      </fieldset>
    </form>}
    {message && <p role={message === 'authSent' ? 'status' : 'alert'}>{t[message]}</p>}
    <p>{t.authPrivacy}</p>
    <p>{t.accountOperator}</p>
    <p>{t.accountContact}: <a href="mailto:li.yu.heng@qq.com">li.yu.heng@qq.com</a></p>
    <p>{t.accountProcessing}</p>
    <p>{t.legalDraft} 2026-10-11-account-draft-v1</p>
  </section>
}
