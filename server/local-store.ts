import { PGlite } from '@electric-sql/pglite'
import { mkdir, readFile } from 'node:fs/promises'
import type { BookingStore } from './store'

// PostgreSQL engine for explicitly synthetic LOCAL previews and database tests.
// This is not Supabase Auth; no local login or user impersonation endpoint exists.
export async function openSyntheticDatabase(directory?: string) {
  if (directory) await mkdir(directory, { recursive: true })
  const db = new PGlite(directory)
  const existing = await db.query<{ found: string | null }>("select to_regclass('public.bookings')::text as found")
  if (!existing.rows[0]?.found) {
    await db.exec(`create role anon nologin; create role authenticated nologin; create role service_role nologin;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as 'select nullif(current_setting(''request.jwt.claim.sub'', true), '''')::uuid';
      grant usage on schema public, auth to anon, authenticated, service_role;
      grant execute on function auth.uid() to authenticated;`)
    await db.exec(await readFile(new URL('../supabase/migrations/202610100001_booking.sql', import.meta.url), 'utf8'))
  }
  await db.exec(await readFile(new URL('../supabase/migrations/202610110003_pricing_consent.sql', import.meta.url), 'utf8'))
  const store: BookingStore = {
    async create(input, owner, reference) {
      // Local API never provides an owner; test fixtures may exercise owner RLS.
      const result = await db.transaction(async tx => { await tx.exec('set local role service_role'); return tx.query<{ result: Awaited<ReturnType<BookingStore['create']>> }>('select public.create_booking_request($1::jsonb, $2::uuid, $3::text) as result', [JSON.stringify(input), owner, reference]) })
      return result.rows[0].result
    },
    async receipt(reference) {
      const result = await db.transaction(async tx => { await tx.exec('set local role service_role'); return tx.query<{ result: Awaited<ReturnType<BookingStore['receipt']>> }>('select public.read_booking_receipt($1::text) as result', [reference]) })
      return result.rows[0].result
    },
    async verifyUser() { return null },
  }
  return { db, store }
}
