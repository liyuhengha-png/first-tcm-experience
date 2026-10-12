// @vitest-environment node
import { readFile } from 'node:fs/promises'
import { randomBytes } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { openSyntheticDatabase } from './local-store'
import { journalCrypto } from './journal-crypto'

const a = '00000000-0000-4000-8000-000000000001'
const b = '00000000-0000-4000-8000-000000000002'
const entryA = '00000000-0000-4000-8000-000000000003'
const entryB = '00000000-0000-4000-8000-000000000004'
describe('journal PostgreSQL RLS — encrypted synthetic fixtures', () => {
  let local: Awaited<ReturnType<typeof openSyntheticDatabase>>
  beforeAll(async () => {
    local = await openSyntheticDatabase()
    await local.db.exec(await readFile(new URL('../supabase/migrations/202610110002_journal.sql', import.meta.url), 'utf8'))
    await local.db.query('insert into auth.users(id) values ($1),($2)', [a, b])
    for (const [owner, id, text] of [[a, entryA, 'Synthetic English note'], [b, entryB, '虚构中文笔记']]) {
      const key = randomBytes(32)
      const crypto = journalCrypto({ generateDataKey: async () => ({ plaintext: Buffer.from(key), wrapped: 'mock-wrapped', version: 'mock-v1' }), unwrapDataKey: async () => Buffer.from(key) })
      const encrypted = await crypto.encrypt(text, owner, id)
      // Only migration-owner fixture setup can insert; no application writer exists.
      await local.db.query('insert into public.journal_entries(id,owner_id,ciphertext,nonce,tag,encrypted_data_key,key_version,schema_version) values ($1,$2,$3,$4,$5,$6,$7,$8)', [id, owner, encrypted.ciphertext, encrypted.nonce, encrypted.tag, encrypted.wrappedKey, encrypted.keyVersion, encrypted.schema])
      key.fill(0)
    }
  }, 30000)
  afterAll(async () => { await local?.db.close() })
  async function asUser(user: string, sql: string) {
    return local.db.transaction(async tx => {
      await tx.exec('set local role authenticated')
      await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [user])
      return tx.query(sql)
    })
  }
  it('isolates two owners with bilingual encrypted payloads', async () => {
    expect((await asUser(a, 'select id from public.journal_entries')).rows).toEqual([{ id: entryA }])
    expect((await asUser(b, 'select id from public.journal_entries')).rows).toEqual([{ id: entryB }])
    expect((await asUser(a, `select id from public.journal_entries where owner_id = '${b}'`)).rows).toEqual([])
    expect((await asUser(b, `select id from public.journal_entries where owner_id = '${a}'`)).rows).toEqual([])
    const stored = JSON.stringify((await local.db.query('select * from public.journal_entries')).rows)
    expect(stored).not.toContain('Synthetic English note'); expect(stored).not.toContain('虚构中文笔记')
  })
  it('denies browser writes, anonymous reads and service-role table access', async () => {
    for (const sql of ['delete from public.journal_entries', "update public.journal_entries set key_version='attacker'", 'insert into public.journal_entries(id) values (gen_random_uuid())']) await expect(asUser(a, sql)).rejects.toThrow()
    for (const role of ['anon', 'service_role']) await expect(local.db.transaction(async tx => { await tx.exec(`set local role ${role}`); return tx.query('select * from public.journal_entries') })).rejects.toThrow()
  })
  it('forces RLS and provides no plaintext clinical columns', async () => {
    const flags = await local.db.query("select relrowsecurity, relforcerowsecurity from pg_class where oid='public.journal_entries'::regclass")
    expect(flags.rows).toEqual([{ relrowsecurity: true, relforcerowsecurity: true }])
    const columns = await local.db.query<{ column_name: string }>("select column_name from information_schema.columns where table_schema='public' and table_name='journal_entries'")
    for (const forbidden of ['summary', 'clinic_name', 'visit_date', 'notes']) expect(columns.rows.map(row => row.column_name)).not.toContain(forbidden)
  })
  it('hides soft-deleted records from owners', async () => {
    await local.db.query('update public.journal_entries set deleted_at=now() where id=$1', [entryA])
    expect((await asUser(a, 'select id from public.journal_entries')).rows).toEqual([])
  })
})
