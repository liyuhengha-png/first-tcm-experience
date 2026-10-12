import { useEffect, useRef } from 'react'
import type { Locale } from './i18n'

type Turnstile = { render: (element: HTMLElement, options: Record<string, unknown>) => string; remove: (id: string) => void; reset: (id: string) => void }
declare global { interface Window { turnstile?: Turnstile } }
export function Challenge({ siteKey, locale, onToken, action = 'booking' }: { siteKey: string; locale: Locale; action?: 'booking' | 'auth'; onToken: (token: string) => void }) {
  const container = useRef<HTMLDivElement>(null)
  const callback = useRef(onToken)
  useEffect(() => { callback.current = onToken }, [onToken])
  useEffect(() => {
    let widget: string | undefined
    let active = true
    function mount() { if (active && window.turnstile && container.current) widget = window.turnstile.render(container.current, { sitekey: siteKey, action, language: locale === 'zh-CN' ? 'zh-cn' : 'en', callback: (token: string) => callback.current(token), 'expired-callback': () => callback.current(''), 'error-callback': () => callback.current('') }) }
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true; script.onload = mount
    if (window.turnstile) mount(); else document.head.append(script)
    return () => { active = false; if (widget && window.turnstile) window.turnstile.remove(widget); script.remove(); callback.current('') }
  }, [siteKey, locale, action])
  return <div ref={container} />
}
