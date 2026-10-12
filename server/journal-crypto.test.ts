// @vitest-environment node
import { randomBytes } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'
import { journalCrypto, type JournalKms } from './journal-crypto'
const owner = '00000000-0000-4000-8000-000000000001'
const other = '00000000-0000-4000-8000-000000000002'
const entry = '00000000-0000-4000-8000-000000000003'
function fixture() {
  const key = randomBytes(32)
  const generated = Buffer.from(key)
  const unwrapped = Buffer.from(key)
  const kms: JournalKms = { generateDataKey: vi.fn(async () => ({ plaintext: generated, wrapped: 'mock-kms-wrapped', version: 'mock-v1' })), unwrapDataKey: vi.fn(async () => unwrapped) }
  return { kms, generated, unwrapped }
}
describe('journal envelope encryption (mock KMS only)', () => {
  it('round trips bilingual synthetic notes without plaintext/key persistence and wipes data keys', async () => {
    const { kms, generated, unwrapped } = fixture()
    const crypto = journalCrypto(kms)
    const text = 'Synthetic fictional note / 虚构演示笔记'
    const encrypted = await crypto.encrypt(text, owner, entry)
    expect(JSON.stringify(encrypted)).not.toContain(text)
    expect(Object.keys(encrypted).sort()).toEqual(['schema', 'ciphertext', 'nonce', 'tag', 'wrappedKey', 'keyVersion'].sort())
    expect(generated.equals(Buffer.alloc(32))).toBe(true)
    expect(await crypto.decrypt(encrypted, owner, entry)).toBe(text)
    expect(unwrapped.equals(Buffer.alloc(32))).toBe(true)
  })
  it('rejects cross-owner, cross-entry and tampered ciphertext', async () => {
    for (const variant of ['owner', 'entry', 'ciphertext'] as const) {
      const { kms, unwrapped } = fixture(); const crypto = journalCrypto(kms)
      const encrypted = await crypto.encrypt('synthetic', owner, entry)
      if (variant === 'ciphertext') { const data = Buffer.from(encrypted.ciphertext, 'base64'); data[0] ^= 1; encrypted.ciphertext = data.toString('base64') }
      await expect(crypto.decrypt(encrypted, variant === 'owner' ? other : owner, variant === 'entry' ? other : entry)).rejects.toThrow()
      expect(unwrapped.equals(Buffer.alloc(32))).toBe(true)
    }
  })
  it('fails closed without KMS, when KMS fails or key size is invalid', async () => {
    await expect(journalCrypto().encrypt('synthetic', owner, entry)).rejects.toThrow()
    const { kms } = fixture()
    vi.mocked(kms.generateDataKey).mockRejectedValue(new Error('mock unavailable'))
    await expect(journalCrypto(kms).encrypt('synthetic', owner, entry)).rejects.toThrow()
    const short = Buffer.alloc(16, 1)
    vi.mocked(kms.generateDataKey).mockResolvedValue({ plaintext: short, wrapped: 'mock', version: 'mock' })
    await expect(journalCrypto(kms).encrypt('synthetic', owner, entry)).rejects.toThrow()
    expect(short.equals(Buffer.alloc(16))).toBe(true)
  })
  it('uses different nonces per encryption', async () => {
    const { kms } = fixture()
    const crypto = journalCrypto(kms)
    const a = await crypto.encrypt('synthetic', owner, entry)
    const b = await crypto.encrypt('synthetic', owner, entry)
    expect(a.nonce).not.toBe(b.nonce)
  })
})
