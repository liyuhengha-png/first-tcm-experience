// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { openSyntheticDatabase } from './local-store'
import { emptyDraft, type BookingInput } from '../src/booking-schema'
import { createApi } from './api'

const userA = '00000000-0000-4000-8000-000000000001'
const userB = '00000000-0000-4000-8000-000000000002'
const input: BookingInput = { ...emptyDraft(), name: 'Synthetic Visitor', email: 'visitor@example.test', date: '2099-01-02', terms: true, privacy: true }
describe('actual PostgreSQL booking persistence and RLS', () => {
  let local: Awaited<ReturnType<typeof openSyntheticDatabase>>
  beforeAll(async () => {
    local = await openSyntheticDatabase()
    await local.db.query('insert into auth.users(id) values ($1),($2)', [userA, userB])
    await local.store.create(input, userA, 'a'.repeat(64))
    await local.store.create({ ...input, uiLocale: 'zh-CN' }, userB, 'b'.repeat(64))
  }, 30000)
  afterAll(async () => { await local?.db.close() })
  async function asUser(user: string, sql: string) {
    return local.db.transaction(async tx => {
      await tx.exec('set local role authenticated')
      await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [user])
      return tx.query<Record<string, unknown>>(sql)
    })
  }
  it('user A and B can only see their own rows, regardless of UI locale', async () => {
    const a = await asUser(userA, 'select owner_id, ui_locale from public.bookings')
    const b = await asUser(userB, 'select owner_id, ui_locale from public.bookings')
    expect(a.rows).toEqual([{ owner_id: userA, ui_locale: 'en' }])
    expect(b.rows).toEqual([{ owner_id: userB, ui_locale: 'zh-CN' }])
    expect((await asUser(userA, `select * from public.bookings where owner_id = '${userB}'`)).rows).toEqual([])
    expect((await asUser(userB, `select * from public.bookings where owner_id = '${userA}'`)).rows).toEqual([])
  })
  it('denies user writes, privileged RPC and receipt enumeration', async () => {
    for (const sql of ["update public.bookings set contact_name = 'attacker'", 'delete from public.bookings', "insert into public.bookings(contact_name) values ('attacker')", 'select * from public.booking_receipts', "select public.read_booking_receipt(repeat('a',64))", "select public.create_booking_request('{}', null, repeat('c',64))"]) await expect(asUser(userA, sql)).rejects.toThrow()
  })
  it('denies anonymous table reads and privileged functions', async () => {
    for (const sql of ['select * from public.bookings', 'select * from public.consent_events', 'select * from public.audit_events', "select public.read_booking_receipt(repeat('a',64))"]) await expect(local.db.transaction(async tx => { await tx.exec('set local role anon'); return tx.query(sql) })).rejects.toThrow()
  })
  it('records separate affirmative consent version, locale, owner and timestamps', async () => {
    const result = await asUser(userB, 'select purpose, version, locale, granted, evidence, created_at from public.consent_events order by purpose')
    expect(result.rows).toHaveLength(2)
    for (const row of result.rows) expect(row).toMatchObject({ version: input.legalVersion, locale: 'zh-CN', granted: true, evidence: 'unchecked-checkbox-affirmed', created_at: expect.any(Date) })
    expect(result.rows.map(row => row.purpose)).toEqual(['booking', 'booking_privacy'])
  })
  it('returns only safe receipt fields and rejects expired receipts', async () => {
    expect(await local.store.receipt('a'.repeat(64))).toEqual({ status: 'REQUESTED', handling: 'MANUAL_PENDING' })
    await local.db.query("update public.booking_receipts set expires_at = now() - interval '1 second' where reference = $1", ['a'.repeat(64)])
    expect(await local.store.receipt('a'.repeat(64))).toBeNull()
  })
  it('rolls back booking, consent and audit if receipt persistence fails', async () => {
    const count = async () => (await local.db.query<{ count: string }>('select count(*)::text as count from public.bookings')).rows[0].count
    const before = await count()
    await expect(local.store.create(input, null, 'b'.repeat(64))).rejects.toThrow()
    expect(await count()).toBe(before)
  })
  it('service-role can execute only the intended request/receipt RPC; all tables have RLS', async () => {
    const result = await local.db.query<{ relname: string; relrowsecurity: boolean; relforcerowsecurity: boolean }>("select relname, relrowsecurity, relforcerowsecurity from pg_class where relname in ('bookings','consent_events','booking_receipts','audit_events')")
    expect(result.rows).toHaveLength(4)
    for (const row of result.rows) expect(row).toMatchObject({ relrowsecurity: true, relforcerowsecurity: true })
    const receipt = await local.db.transaction(async tx => { await tx.exec('set local role service_role'); return tx.query<{ receipt: unknown }>("select public.read_booking_receipt(repeat('b',64)) as receipt") })
    expect(receipt.rows[0].receipt).toEqual({ status: 'REQUESTED', handling: 'MANUAL_PENDING' })
  })
})
it('real API persists synthetic request and consent across database close/reopen', async () => {
  const directory = resolve('.local-data/tests/' + randomUUID())
  let local = await openSyntheticDatabase(directory)
  try {
    const origin = 'http://127.0.0.1:4173'
    const response = await createApi({ origin, store: local.store })(new Request(origin + '/api/bookings', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(input) }), 'synthetic-ip')
    expect(response.status).toBe(201)
    const receipt = await response.json()
    await local.db.close()
    local = await openSyntheticDatabase(directory)
    expect(await local.store.receipt(receipt.reference)).toEqual({ status: 'REQUESTED', handling: 'MANUAL_PENDING' })
    expect((await local.db.query('select * from public.consent_events')).rows).toHaveLength(2)
    expect((await local.db.query('select * from public.audit_events')).rows).toHaveLength(1)
  } finally { await local.db.close() }
}, 30000)
