begin;
select plan(21);

select ok(
  not has_table_privilege('anon', 'public.guests', 'select'),
  'anon has no SELECT privilege on guests'
);
select ok(
  not has_table_privilege('anon', 'public.guests', 'insert'),
  'anon has no INSERT privilege on guests'
);
select ok(
  not has_table_privilege('anon', 'public.guests', 'update'),
  'anon has no UPDATE privilege on guests'
);
select ok(
  not has_table_privilege('anon', 'public.guests', 'delete'),
  'anon has no DELETE privilege on guests'
);
select ok(
  not has_table_privilege('anon', 'public.admin_users', 'select'),
  'anon has no SELECT privilege on admin_users'
);
select ok(
  not has_function_privilege('anon', 'public.import_guests(jsonb, boolean)', 'execute'),
  'anon cannot execute import_guests'
);
select ok(
  not has_table_privilege('anon', 'public.guest_message_sends', 'select'),
  'anon has no SELECT privilege on guest_message_sends'
);
select ok(
  not has_table_privilege('anon', 'public.guest_message_sends', 'insert'),
  'anon has no INSERT privilege on guest_message_sends'
);
select ok(
  not has_table_privilege('anon', 'public.guest_message_sends', 'update'),
  'anon has no UPDATE privilege on guest_message_sends'
);
select ok(
  not has_table_privilege('anon', 'public.guest_message_sends', 'delete'),
  'anon has no DELETE privilege on guest_message_sends'
);
select ok(
  not has_table_privilege('anon', 'public.guest_link_opens', 'select'),
  'anon has no SELECT privilege on guest_link_opens'
);
select ok(
  not has_table_privilege('anon', 'public.guest_link_opens', 'insert'),
  'anon has no INSERT privilege on guest_link_opens'
);
select ok(
  not has_table_privilege('anon', 'public.guest_link_opens', 'update'),
  'anon has no UPDATE privilege on guest_link_opens'
);
select ok(
  not has_table_privilege('anon', 'public.guest_link_opens', 'delete'),
  'anon has no DELETE privilege on guest_link_opens'
);
select ok(
  has_function_privilege('anon', 'public.get_guest(uuid)', 'execute'),
  'anon can execute get_guest'
);
select ok(
  has_function_privilege('anon', 'public.record_link_open(uuid)', 'execute'),
  'anon can execute record_link_open'
);
select ok(
  has_function_privilege(
    'anon',
    'public.submit_rsvp(uuid, text, integer, integer, integer, integer, integer, text)',
    'execute'
  ),
  'anon can execute submit_rsvp'
);

set local role anon;

select throws_ok(
  $$ select * from public.guests $$,
  '42501',
  NULL,
  'anon SELECT from guests is rejected'
);

select throws_ok(
  $$ select * from public.guest_message_sends $$,
  '42501',
  NULL,
  'anon SELECT from guest_message_sends is rejected'
);

select throws_ok(
  $$ select * from public.guest_link_opens $$,
  '42501',
  NULL,
  'anon SELECT from guest_link_opens is rejected'
);

select throws_ok(
  $$ select public.import_guests('[]'::jsonb, true) $$,
  '42501',
  NULL,
  'anon execute of import_guests is rejected'
);

select * from finish();
rollback;
