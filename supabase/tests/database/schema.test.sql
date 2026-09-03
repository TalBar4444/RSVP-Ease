begin;
select plan(28);

select has_schema('private', 'private schema exists');
select has_table('public', 'guests', 'guests table exists');
select has_table('public', 'admin_users', 'admin_users table exists');

select has_column('public', 'guests', 'id', 'guests.id exists');
select has_column('public', 'guests', 'created_at', 'guests.created_at exists');
select has_column('public', 'guests', 'updated_at', 'guests.updated_at exists');
select has_column('public', 'guests', 'name', 'guests.name exists');
select has_column('public', 'guests', 'phone', 'guests.phone exists');
select has_column('public', 'guests', 'status', 'guests.status exists');
select has_column('public', 'guests', 'guests_count', 'guests.guests_count exists');
select has_column('public', 'guests', 'children_count', 'guests.children_count exists');
select has_column('public', 'guests', 'group_affiliation', 'guests.group_affiliation exists');

select col_is_pk('public', 'guests', 'id', 'guests.id is the primary key');
select col_is_pk('public', 'admin_users', 'user_id', 'admin_users.user_id is the primary key');

select ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.guests'::regclass
      and conname = 'guests_status_check'
  ),
  'status check exists'
);
select ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.guests'::regclass
      and conname = 'guests_adults_count_check'
  ),
  'adults check exists'
);
select ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.guests'::regclass
      and conname = 'guests_children_count_check'
  ),
  'children check exists'
);

select ok(
  (select c.relrowsecurity
   from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'guests'),
  'RLS is enabled on guests'
);

select ok(
  (select c.relrowsecurity
   from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'admin_users'),
  'RLS is enabled on admin_users'
);

select policies_are(
  'public',
  'guests',
  array[
    'admins_select_guests',
    'admins_insert_guests',
    'admins_update_guests',
    'admins_delete_guests'
  ],
  'guests has only the admin policies'
);

select has_function('public', 'get_guest', array['uuid'], 'get_guest exists');
select has_function(
  'public',
  'submit_rsvp',
  array['uuid', 'text', 'integer', 'integer', 'boolean', 'boolean', 'boolean', 'text'],
  'submit_rsvp exists'
);
select has_function('public', 'import_guests', array['jsonb', 'boolean'], 'import_guests exists');
select has_function('private', 'is_admin', 'private.is_admin exists');
select has_function('public', 'is_current_user_admin', 'is_current_user_admin exists');

select ok(
  (select p.prosecdef
   from pg_proc p
   join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'private' and p.proname = 'is_admin'),
  'private.is_admin is SECURITY DEFINER'
);

select ok(
  (select bool_and(p.prosecdef)
   from pg_proc p
   join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname in ('get_guest', 'submit_rsvp', 'import_guests', 'is_current_user_admin')),
  'public RPCs are SECURITY DEFINER'
);

select ok(
  not has_table_privilege('anon', 'public.guests', 'truncate'),
  'anon cannot truncate guests'
);

select * from finish();
rollback;
