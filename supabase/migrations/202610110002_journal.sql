-- Prepared M2 schema; NOT applied to cloud. No real-data writes enabled by this migration.
begin;
create table public.journal_entries (
  id uuid primary key,
  owner_id uuid not null references auth.users(id),
  ciphertext text not null check (length(ciphertext) <= 65536),
  nonce text not null check (length(nonce) = 16),
  tag text not null check (length(tag) = 24),
  encrypted_data_key text not null check (length(encrypted_data_key) between 1 and 16384),
  key_version text not null check (length(key_version) between 1 and 256),
  schema_version integer not null check (schema_version = 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
-- Visit date and clinical fields belong inside the encrypted payload, not plaintext columns.
alter table public.journal_entries enable row level security;
alter table public.journal_entries force row level security;
revoke all on public.journal_entries from public, anon, authenticated, service_role;
grant select on public.journal_entries to authenticated;
create policy own_journal_read on public.journal_entries for select to authenticated
  using (owner_id = (select auth.uid()) and deleted_at is null);
-- No browser writes, operator grants or privileged write RPC until managed KMS,
-- consent, server authorization and audited operations are implemented.
commit;
