import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

// Never print matched values. This is a bounded marker scan, not a security certification.
const root = resolve('dist')
const patterns = [/sb_secret_[a-zA-Z0-9_-]+/, /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, /SUPABASE_SERVICE_ROLE_KEY/, /TURNSTILE_SECRET_KEY/, /JOURNAL_KMS_KEY_ID/]
async function scan(path: string): Promise<number> {
  let scanned = 0
  for (const item of await readdir(path, { withFileTypes: true })) {
    const target = resolve(path, item.name)
    if (item.isDirectory()) scanned += await scan(target)
    else if (/\.(js|html|css|map|json)$/.test(item.name)) {
      const text = await readFile(target, 'utf8')
      if (patterns.some(pattern => pattern.test(text))) throw new Error('Public bundle contains a prohibited server-secret marker; matched content suppressed')
      scanned++
    }
  }
  return scanned
}
try { const files = await scan(root); if (!files) throw new Error('No build files found'); console.info(JSON.stringify({ publicBundleMarkerScan: 'passed', files })) }
catch { console.error('Public bundle marker scan failed; no matched content logged'); process.exitCode = 1 }
