// @vitest-environment node
import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('public mail template boundaries', () => {
  it('provides both languages, OTP placeholder and no account, health or wallet data', async () => {
    const template = await readFile(new URL('../supabase/templates/email-otp.html', import.meta.url), 'utf8')
    expect(template).toContain('lang="en"'); expect(template).toContain('lang="zh-CN"')
    expect(template.match(/\{\{\s*\.Token\s*\}\}/g)).toHaveLength(1)
    expect(template).not.toMatch(/\{\{\s*\.(Email|ConfirmationURL|TokenHash|Data)/)
    expect(template).not.toMatch(/<script|<img|https?:\/\//i)
  })
})
