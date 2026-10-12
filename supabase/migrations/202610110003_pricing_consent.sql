-- Idempotent version update. Preserve prior consent records and function permissions.
begin;
do $$
declare definition text;
begin
  select pg_get_functiondef('public.create_booking_request(jsonb,uuid,text)'::regprocedure) into definition;
  if position('2026-10-10-draft-v1' in definition) > 0 then
    execute replace(definition, '2026-10-10-draft-v1', '2026-10-11-draft-v2');
  elsif position('2026-10-11-draft-v2' in definition) = 0 then
    raise exception 'Unexpected consent version; review required';
  end if;
end $$;
commit;
