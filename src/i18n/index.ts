import { en } from './en'
import { zhCN } from './zh-CN'
export type Locale = 'en' | 'zh-CN'
export const dictionaries = { en, 'zh-CN': zhCN }
export const preferenceKey = 'first-tcm-ui-locale'
// English is the fallback; never infer nationality or clinical language.
export function initialLocale(): Locale {
  try { return localStorage.getItem(preferenceKey) === 'zh-CN' ? 'zh-CN' : 'en' }
  catch { return 'en' }
}
export function saveLocale(locale: Locale) {
  try { localStorage.setItem(preferenceKey, locale) } catch { /* Memory-only fallback. */ }
}
