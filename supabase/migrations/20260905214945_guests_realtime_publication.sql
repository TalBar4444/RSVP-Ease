-- Stream public.guests to authenticated admins via Realtime postgres_changes.
-- Replica identity stays DEFAULT so DELETE payloads are PK-only (RLS cannot filter DELETE events).

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'guests'
  ) then
    alter publication supabase_realtime add table public.guests;
  end if;
end
$$;
