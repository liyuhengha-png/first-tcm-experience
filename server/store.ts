import type { BookingInput } from '../src/booking-schema'
export type SafeReceipt = { status: 'REQUESTED' | 'CONFIRMED' | 'CANCELLED'; handling: 'MANUAL_PENDING' }
export interface BookingStore {
  create(input: BookingInput, owner: string | null, reference: string): Promise<SafeReceipt & { reference: string }>
  receipt(reference: string): Promise<SafeReceipt | null>
  verifyUser(token: string): Promise<string | null>
}
export function supabaseStore(url: string, key: string): BookingStore {
  const base = new URL(url)
  if (base.protocol !== 'https:') throw new Error('HTTPS Supabase URL required')
  async function rpc(name: string, body: unknown) {
    const headers: Record<string, string> = { apikey: key, 'Content-Type': 'application/json' }
    // Modern secret keys authenticate through apikey, not as user JWTs.
    if (!key.startsWith('sb_secret_')) headers.Authorization = `Bearer ${key}`
    const response = await fetch(new URL(`/rest/v1/rpc/${name}`, base), { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(8000) })
    if (!response.ok) throw new Error('storage unavailable')
    return response.json()
  }
  return {
    create: (input, owner, reference) => rpc('create_booking_request', { p_input: input, p_owner: owner, p_reference: reference }),
    receipt: reference => rpc('read_booking_receipt', { p_reference: reference }),
    async verifyUser(token) {
      const response = await fetch(new URL('/auth/v1/user', base), { headers: { apikey: key, Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8000) })
      if (!response.ok) return null
      const user = await response.json()
      return typeof user.id === 'string' && /^[0-9a-f-]{36}$/.test(user.id) ? user.id : null
    },
  }
}
