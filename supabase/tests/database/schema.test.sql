begin;
select plan(58);

select has_schema('private', 'private schema exists');
select has_table('public', 'guests', 'guests table exists');
select has_table('public', 'admin_users', 'admin_users table exists');
select has_table('public', 'guest_message_sends', 'guest_message_sends table exists');
select has_table('public', 'guest_link_opens', 'guest_link_opens table exists');

select has_column('public', 'guests', 'id', 'guests.id exists');
select has_column('public', 'guests', 'created_at', 'guests.created_at exists');
select has_column('public', 'guests', 'updated_at', 'guests.updated_at exists');
select has_column('public', 'guests', 'name', 'guests.name exists');
select has_column('public', 'guests', 'phone', 'guests.phone exists');
select has_column('public', 'guests', 'status', 'guests.status exists');
select has_column('public', 'guests', 'guests_count', 'guests.guests_count exists');
select has_column('public', 'guests', 'vegetarian_count', 'guests.vegetarian_count exists');
select has_column('public', 'guests', 'vegan_count', 'guests.vegan_count exists');
select has_column('public', 'guests', 'gluten_free_count', 'guests.gluten_free_count exists');
select has_column('public', 'guests', 'kids_meal_count', 'guests.kids_meal_count exists');
select has_column('public', 'guests', 'group_affiliation', 'guests.group_affiliation exists');
select hasnt_column('public', 'guests', 'children_count', 'guests.children_count is gone');
select hasnt_column('public', 'guests', 'is_vegetarian', 'guests.is_vegetarian is gone');
select hasnt_column('public', 'guests', 'is_vegan', 'guests.is_vegan is gone');
select hasnt_column('public', 'guests', 'is_gluten_free', 'guests.is_gluten_free is gone');

select has_column('public', 'guest_message_sends', 'guest_id', 'guest_message_sends.guest_id exists');
select has_column('public', 'guest_message_sends', 'message_type', 'guest_message_sends.message_type exists');
select has_column('public', 'guest_message_sends', 'channel', 'guest_message_sends.channel exists');
select has_column('public', 'guest_message_sends', 'sent_at', 'guest_message_sends.sent_at exists');
select has_column('public', 'guest_link_opens', 'guest_id', 'guest_link_opens.guest_id exists');
select has_column('public', 'guest_link_opens', 'opened_at', 'guest_link_opens.opened_at exists');
select hasnt_column(
  'public',
  'guest_link_opens',
  'message_type',
  'guest_link_opens has no message_type so opens are not per invitation vs reminder'
);

select col_is_pk('public', 'guests', 'id', 'guests.id is the primary key');
select col_is_pk('public', 'admin_users', 'user_id', 'admin_users.user_id is the primary key');
select col_is_pk(
  'public',
  'guest_message_sends',
  array['guest_id', 'message_type'],
  'guest_message_sends primary key is guest_id + message_type'
);
select col_is_pk('public', 'guest_link_opens', 'guest_id', 'guest_link_opens.guest_id is the primary key');

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
      and conname = 'guests_count_check'
  ),
  'guests_count check exists'
);
select ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.guests'::regclass
      and conname = 'guests_vegetarian_count_check'
  ),
  'vegetarian count check exists'
);
select ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.guests'::regclass
      and conname = 'guests_vegan_count_check'
  ),
  'vegan count check exists'
);
select ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.guests'::regclass
      and conname = 'guests_gluten_free_count_check'
  ),
  'gluten-free count check exists'
);
select ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.guests'::regclass
      and conname = 'guests_kids_meal_count_check'
  ),
  'kids meal count check exists'
);
select ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.guests'::regclass
      and conname = 'guests_special_meals_count_check'
  ),
  'special meals sum check exists'
);
select ok(
  not exists (
    select 1 from pg_constraint
    where conrelid = 'public.guests'::regclass
      and conname = 'guests_adults_count_check'
  ),
  'adults check is gone'
);
select ok(
  not exists (
    select 1 from pg_constraint
    where conrelid = 'public.guests'::regclass
      and conname = 'guests_children_count_check'
  ),
  'children check is gone'
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
select ok(
  (select c.relrowsecurity
   from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'guest_message_sends'),
  'RLS is enabled on guest_message_sends'
);
select ok(
  (select c.relrowsecurity
   from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'guest_link_opens'),
  'RLS is enabled on guest_link_opens'
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

select policies_are(
  'public',
  'guest_message_sends',
  array[
    'admins_select_guest_message_sends',
    'admins_insert_guest_message_sends',
    'admins_update_guest_message_sends',
    'admins_delete_guest_message_sends'
  ],
  'guest_message_sends has only the admin policies'
);

select policies_are(
  'public',
  'guest_link_opens',
  array[
    'admins_select_guest_link_opens',
    'admins_insert_guest_link_opens',
    'admins_update_guest_link_opens',
    'admins_delete_guest_link_opens'
  ],
  'guest_link_opens has only the admin policies'
);

select has_function('public', 'get_guest', array['uuid'], 'get_guest exists');
select has_function('public', 'record_link_open', array['uuid'], 'record_link_open exists');
select has_function(
  'public',
  'submit_rsvp',
  array['uuid', 'text', 'integer', 'integer', 'integer', 'integer', 'integer', 'text'],
  'submit_rsvp exists'
);
select hasnt_function(
  'public',
  'submit_rsvp',
  array['uuid', 'text', 'integer', 'integer', 'boolean', 'boolean', 'boolean', 'text'],
  'old submit_rsvp signature is gone'
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
     and p.proname in (
       'get_guest',
       'submit_rsvp',
       'import_guests',
       'is_current_user_admin',
       'record_link_open'
     )),
  'public RPCs are SECURITY DEFINER'
);

select ok(
  not has_table_privilege('anon', 'public.guests', 'truncate'),
  'anon cannot truncate guests'
);

select * from finish();
rollback;
