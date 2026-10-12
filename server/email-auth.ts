import { z } from 'zod'

const sessionSchema = z.object({ access_token: z.string().min(1).max(4096), expires_in: z.number().int().positive().max(86400), user: z.object({ id: z.uuid() }) })

// Managed Supabase OTP only. No tokens in URLs, no local password verification.
export function emailAuth(url: string, publishableKey: string, transport: typeof fetch = fetch, allowRegistration = false) {
  const base = new URL(url)
  if (base.protocol !== 'https:') throw new Error('Managed authentication requires HTTPS')
  async function post(path: string, body: unknown) {
    const response = await transport(new URL(path, base), {
      method: 'POST', headers: { apikey: publishableKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) throw new Error('Authentication unavailable')
    return response
  }
  return {
    async validate(accessToken: string) {
      const response = await transport(new URL('/auth/v1/user', base), {
        headers: { apikey: publishableKey, Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(8000),
      })
      if (!response.ok) throw new Error('Authentication unavailable')
      const parsed = z.object({ id: z.uuid() }).safeParse(await response.json())
      if (!parsed.success) throw new Error('Authentication unavailable')
      return parsed.data.id
    },
    async request(email: string) { await post('/auth/v1/otp', { email, create_user: allowRegistration }) },
    async verify(email: string, token: string) {
      const response = await post('/auth/v1/verify', { email, token, type: 'email' })
      const parsed = sessionSchema.safeParse(await response.json())
      if (!parsed.success) throw new Error('Authentication unavailable')
      return { accessToken: parsed.data.access_token, expiresIn: parsed.data.expires_in, userId: parsed.data.user.id }
    },
  }
}
