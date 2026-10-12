import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { z } from 'zod'

// A real managed KMS adapter is required in production. No env/plaintext-key fallback.
export interface JournalKms {
  generateDataKey(): Promise<{ plaintext: Buffer; wrapped: string; version: string }>
  unwrapDataKey(wrapped: string, version: string): Promise<Buffer>
}
const recordSchema = z.object({ schema: z.literal(1), ciphertext: z.string().max(65536), nonce: z.string(), tag: z.string(), wrappedKey: z.string().min(1).max(16384), keyVersion: z.string().min(1).max(256) }).strict()
export type EncryptedJournal = z.infer<typeof recordSchema>
const contextSchema = z.object({ ownerId: z.uuid(), entryId: z.uuid() }).strict()
function context(ownerId: string, entryId: string) {
  contextSchema.parse({ ownerId, entryId })
  return Buffer.from(JSON.stringify({ purpose: 'first-tcm-journal', schema: 1, ownerId, entryId }))
}
function decode(value: string, length?: number) {
  const decoded = Buffer.from(value, 'base64')
  if (decoded.toString('base64') !== value || (length !== undefined && decoded.length !== length)) throw new Error('Journal unavailable')
  return decoded
}
export function journalCrypto(kms?: JournalKms) {
  return {
    async encrypt(text: string, ownerId: string, entryId: string): Promise<EncryptedJournal> {
      if (!kms || Buffer.byteLength(text) > 32768) throw new Error('Journal unavailable')
      const aad = context(ownerId, entryId)
      const key = await kms.generateDataKey()
      try {
        if (key.plaintext.length !== 32 || !key.wrapped || !key.version) throw new Error('Journal unavailable')
        const nonce = randomBytes(12)
        const cipher = createCipheriv('aes-256-gcm', key.plaintext, nonce)
        cipher.setAAD(aad)
        const ciphertext = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
        return recordSchema.parse({ schema: 1, ciphertext: ciphertext.toString('base64'), nonce: nonce.toString('base64'), tag: cipher.getAuthTag().toString('base64'), wrappedKey: key.wrapped, keyVersion: key.version })
      } finally { key.plaintext.fill(0) }
    },
    async decrypt(record: EncryptedJournal, ownerId: string, entryId: string): Promise<string> {
      if (!kms) throw new Error('Journal unavailable')
      const parsed = recordSchema.parse(record)
      const aad = context(ownerId, entryId)
      const nonce = decode(parsed.nonce, 12), tag = decode(parsed.tag, 16), ciphertext = decode(parsed.ciphertext)
      const key = await kms.unwrapDataKey(parsed.wrappedKey, parsed.keyVersion)
      try {
        if (key.length !== 32) throw new Error('Journal unavailable')
        const cipher = createDecipheriv('aes-256-gcm', key, nonce)
        cipher.setAAD(aad); cipher.setAuthTag(tag)
        return Buffer.concat([cipher.update(ciphertext), cipher.final()]).toString('utf8')
      } finally { key.fill(0) }
    },
  }
}
