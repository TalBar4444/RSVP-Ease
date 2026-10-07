begin;
select plan(6);

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

select ok(
  exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'guest_message_sends'
  ),
  'guest_message_sends is in supabase_realtime publication'
);

select ok(
  exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'guest_link_opens'
  ),
  'guest_link_opens is in supabase_realtime publication'
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

select is(
  (
    select c.relreplident
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'guest_message_sends'
  ),
  'd',
  'guest_message_sends replica identity is default'
);

select is(
  (
    select c.relreplident
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'guest_link_opens'
  ),
  'd',
  'guest_link_opens replica identity is default'
);

select * from finish();
rollback;
