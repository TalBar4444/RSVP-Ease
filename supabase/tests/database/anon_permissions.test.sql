begin;
select plan(10);

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
  has_function_privilege('anon', 'public.get_guest(uuid)', 'execute'),
  'anon can execute get_guest'
);
select ok(
  has_function_privilege(
    'anon',
    'public.submit_rsvp(uuid, text, integer, integer, boolean, boolean, boolean, text)',
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
  $$ select public.import_guests('[]'::jsonb, true) $$,
  '42501',
  NULL,
  'anon execute of import_guests is rejected'
);

select * from finish();
rollback;
