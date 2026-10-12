-- Apply through reviewed Supabase migrations. No journal or clinical columns.
begin;
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id),
  contact_name text not null check (length(contact_name) between 1 and 80),
  contact_email text not null check (length(contact_email) <= 254),
  messenger text not null default '' check (length(messenger) <= 100),
  preferred_date date not null,
  preferred_time text not null check (preferred_time in ('morning','afternoon')),
  guests integer not null check (guests between 1 and 6),
  preferred_service_language text not null check (preferred_service_language in ('en','zh-CN')),
  ui_locale text not null check (ui_locale in ('en','zh-CN')),
  status text not null default 'REQUESTED' check (status in ('REQUESTED','CONFIRMED','CANCELLED')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.consent_events (
  id uuid primary key default gen_random_uuid(), owner_id uuid references auth.users(id),
  booking_id uuid not null references public.bookings(id),
  purpose text not null check (purpose in ('booking','booking_privacy')),
  version text not null, locale text not null check (locale in ('en','zh-CN')),
  granted boolean not null check (granted), evidence text not null check (evidence = 'unchecked-checkbox-affirmed'),
  created_at timestamptz not null default now()
);
create table public.booking_receipts (
  reference text primary key check (reference ~ '^[a-f0-9]{64}$'),
  booking_id uuid not null unique references public.bookings(id),
  expires_at timestamptz not null default now() + interval '24 hours'
);
create table public.audit_events (
  id uuid primary key default gen_random_uuid(), actor_id uuid,
  action text not null, resource_type text not null, resource_id uuid,
  outcome text not null, created_at timestamptz not null default now()
);
alter table public.bookings enable row level security;
alter table public.bookings force row level security;
alter table public.consent_events enable row level security;
alter table public.consent_events force row level security;
alter table public.booking_receipts enable row level security;
alter table public.booking_receipts force row level security;
alter table public.audit_events enable row level security;
alter table public.audit_events force row level security;
revoke all on public.bookings, public.consent_events, public.booking_receipts, public.audit_events from public, anon, authenticated;
grant select on public.bookings, public.consent_events to authenticated;
create policy own_booking_read on public.bookings for select to authenticated using (owner_id = (select auth.uid()));
create policy own_consent_read on public.consent_events for select to authenticated using (owner_id = (select auth.uid()));
-- No browser inserts/updates/deletes, receipt reads or audit reads.
create function public.create_booking_request(p_input jsonb, p_owner uuid, p_reference text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare new_id uuid;
begin
  if p_input->>'legalVersion' is distinct from '2026-10-10-draft-v1' or
     p_input->>'terms' is distinct from 'true' or p_input->>'privacy' is distinct from 'true' or
     (p_input->>'date')::date < (now() at time zone 'Asia/Shanghai')::date or
     p_input->>'website' is distinct from '' then
    raise exception 'invalid request';
  end if;
  insert into public.bookings(owner_id, contact_name, contact_email, messenger, preferred_date, preferred_time, guests, preferred_service_language, ui_locale)
  values(p_owner, p_input->>'name', p_input->>'email', p_input->>'messenger', (p_input->>'date')::date, p_input->>'time', (p_input->>'guests')::integer, p_input->>'serviceLanguage', p_input->>'uiLocale') returning id into new_id;
  insert into public.consent_events(owner_id, booking_id, purpose, version, locale, granted, evidence)
  values(p_owner, new_id, 'booking', p_input->>'legalVersion', p_input->>'uiLocale', true, 'unchecked-checkbox-affirmed'),
        (p_owner, new_id, 'booking_privacy', p_input->>'legalVersion', p_input->>'uiLocale', true, 'unchecked-checkbox-affirmed');
  insert into public.booking_receipts(reference, booking_id) values(p_reference, new_id);
  insert into public.audit_events(actor_id, action, resource_type, resource_id, outcome)
  values(p_owner, 'booking.request', 'booking', new_id, 'success');
  return jsonb_build_object('reference', p_reference, 'status', 'REQUESTED', 'handling', 'MANUAL_PENDING');
end $$;
create function public.read_booking_receipt(p_reference text)
returns jsonb language sql security definer set search_path = '' as $$
  select jsonb_build_object('status', b.status, 'handling', 'MANUAL_PENDING')
  from public.booking_receipts r join public.bookings b on b.id = r.booking_id
  where r.reference = p_reference and r.expires_at > now();
$$;
revoke all on function public.create_booking_request(jsonb,uuid,text), public.read_booking_receipt(text) from public, anon, authenticated;
grant execute on function public.create_booking_request(jsonb,uuid,text), public.read_booking_receipt(text) to service_role;
commit;
