import { z } from 'zod'
export const legalVersion = '2026-10-11-draft-v2'
export const bookingSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.email().max(254),
  messenger: z.string().trim().max(100),
  date: z.iso.date(),
  time: z.enum(['morning', 'afternoon']),
  guests: z.number().int().min(1).max(6),
  serviceLanguage: z.enum(['en', 'zh-CN']),
  uiLocale: z.enum(['en', 'zh-CN']),
  terms: z.literal(true), privacy: z.literal(true),
  legalVersion: z.literal(legalVersion),
  website: z.string().max(100),
  challengeToken: z.string().max(2048),
}).strict().refine((value) => value.date >= new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()), { path: ['date'], message: 'date' })
export type BookingInput = z.infer<typeof bookingSchema>
export type BookingDraft = Omit<BookingInput, 'terms' | 'privacy'> & { terms: boolean; privacy: boolean }
export const emptyDraft = (): BookingDraft => ({ name: '', email: '', messenger: '', date: '', time: 'morning', guests: 1, serviceLanguage: 'en', uiLocale: 'en', terms: false, privacy: false, legalVersion, website: '', challengeToken: '' })
