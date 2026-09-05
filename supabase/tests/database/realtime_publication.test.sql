begin;
select plan(2);

select ok(
  exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'guests'
  ),
  'guests is in supabase_realtime publication'
);

select is(
  (
    select c.relreplident
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'guests'
  ),
  'd',
  'guests replica identity is default'
);

select * from finish();
rollback;
