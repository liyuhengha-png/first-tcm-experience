import { useEffect, useState } from 'react'
import { dictionaries, initialLocale, saveLocale, type Locale } from './i18n'
import { Booking, Receipt } from './Booking'
import { Journal } from './Journal'
import { EmailLogin } from './EmailLogin'
import { DevnetWallet } from './DevnetWallet'

const routes = [ ['/', 'discover'], ['/book', 'book'], ['/login', 'account'], ['/journal', 'journal'], ['/demo/solana', 'solana'] ] as const
export function App({ path: initialPath = window.location.pathname }: { path?: string }) {
  const [path, setPath] = useState(initialPath)
  const [locale, setLocale] = useState<Locale>(initialLocale)
  const t = dictionaries[locale]
  useEffect(() => { document.documentElement.lang = locale }, [locale])
  function switchLocale(next: Locale) { setLocale(next); saveLocale(next) }
  useEffect(() => { const navigate = () => setPath(window.location.pathname); window.addEventListener('popstate', navigate); return () => window.removeEventListener('popstate', navigate) }, [])
  function onReceipt(reference: string) { const next = `/confirmation/${reference}`; window.history.pushState({}, '', next); setPath(next) }
  const section = path === '/book' ? 'book' : path === '/journal' ? 'journal' : path === '/demo/solana' ? 'solana' : /^\/confirmation\/[^/]+$/.test(path) ? 'confirmation' : null
  const notice = section === 'book' ? t.bookNotice : section === 'journal' ? t.journalNotice : section === 'solana' ? t.solanaNotice : t.confirmationNotice
  return <>
    <a href="#content" className="skip-link">{t.skip}</a>
    <header className="mx-auto max-w-5xl px-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <a href="/" className="brand">{t.brand}</a>
        <div role="group" aria-label={t.language} className="flex items-center gap-2">
          <button type="button" lang="zh-CN" aria-pressed={locale === 'zh-CN'} onClick={() => switchLocale('zh-CN')}>中文</button>
          <span aria-hidden="true">|</span>
          <button type="button" lang="en" aria-pressed={locale === 'en'} onClick={() => switchLocale('en')}>English</button>
        </div>
      </div>
      <nav aria-label={t.brand} className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
        {routes.map(([url, key]) => <a key={url} href={url} aria-current={path === url ? 'page' : undefined}>{t[key]}</a>)}
      </nav>
    </header>
    <main id="content" tabIndex={-1} className="mx-auto max-w-5xl px-6 py-10">
      <p className="eyebrow">{t.stage}</p>
      {path === '/' ? <>
        <h1>{t.title}</h1><p className="lead">{t.intro}</p>
        <section className="card"><h2>{t.price}</h2><p className="price">{new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0 }).format(99)}</p><p>{t.provisional}</p><h3>{t.bookingDeposit}</h3><p>{t.bookingDepositNotice}</p></section>
        <a className="primary inline-block mt-6" href="/book">{t.cta}</a>
        <div className="mt-8 grid gap-6 md:grid-cols-2"><section className="card"><h2>{t.inclusions}</h2><p>{t.inclusionsCopy}</p></section><section className="card"><h2>{t.exclusions}</h2><p>{t.exclusionsCopy}</p></section></div>
        <section className="card mt-8"><h2>{t.faq}</h2><details><summary>{t.faqOne}</summary><p>{t.faqOneAnswer}</p></details><details className="mt-4"><summary>{t.faqTwo}</summary><p>{t.faqTwoAnswer}</p></details></section>
      </> : section === 'book' ? <Booking t={t} locale={locale} onReceipt={onReceipt} /> : section === 'confirmation' ? <Receipt key={path} reference={path.split('/')[2]} t={t} /> : path === '/login' ? <section className="card"><h1>{t.account}</h1><p>{t.accountNotice}</p><EmailLogin t={t} locale={locale} /></section> : section === 'journal' ? <Journal t={t} /> : <section className="card"><h1>{section ? t[section] : t.notFound}</h1>{section && <><p className="eyebrow">{t.unavailable}</p><p>{notice}</p></>}</section>}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="card"><h2>{t.safetyTitle}</h2><p>{t.safety}</p></section>
        <section className="card"><h2>{t.privacyTitle}</h2><p>{t.privacy}</p></section>
      </div>
      {section === 'solana' && <DevnetWallet t={t} />}
      {section === 'solana' && <><section className="card mt-8"><h2>{t.escrowRules}</h2><p>{t.escrowProgress}</p><p className="mt-4">{t.escrowRulesCopy}</p><p className="mt-4">{t.escrowLimitations}</p></section><section className="card mt-8"><h2>{t.contactOrganizer}</h2><p>{t.offlinePaymentNotice}</p><a className="primary inline-block mt-4" href="https://t.me/liyuhengyoooo" target="_blank" rel="noopener noreferrer">{t.contactOrganizer} · @liyuhengyoooo</a><p className="mt-4">{t.contactPrivacy}</p></section></>}
    </main>
    <footer className="mx-auto max-w-5xl px-6 py-8">{t.footer}</footer>
  </>
}


