-- Read-only verification. Does not alter tables, policies or data.
select c.relname as table_name, c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced,
       has_table_privilege('anon', c.oid, 'SELECT') as anon_can_select,
       has_table_privilege('authenticated', c.oid, 'SELECT') as signed_in_can_select,
       has_table_privilege('authenticated', c.oid, 'INSERT') as signed_in_can_insert,
       has_table_privilege('authenticated', c.oid, 'UPDATE') as signed_in_can_update,
       has_table_privilege('authenticated', c.oid, 'DELETE') as signed_in_can_delete
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('bookings','consent_events','booking_receipts','audit_events')
order by c.relname;

select tablename, policyname, roles, cmd, qual, with_check
from pg_policies where schemaname = 'public'
and tablename in ('bookings','consent_events','booking_receipts','audit_events')
order by tablename, policyname;

select p.proname as function_name, p.prosecdef as security_definer,
       p.proconfig as function_settings,
       has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as signed_in_can_execute,
       has_function_privilege('service_role', p.oid, 'EXECUTE') as server_can_execute
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('create_booking_request','read_booking_receipt')
order by p.proname;
