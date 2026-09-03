begin;
select plan(21);

create or replace function pg_temp.create_auth_user(user_id uuid, user_email text)
returns void
language plpgsql
as $$
begin
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    user_id,
    'authenticated',
    'authenticated',
    user_email,
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );
end;
$$;

select pg_temp.create_auth_user(
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'admin@example.test'
);
select pg_temp.create_auth_user(
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'guest-user@example.test'
);

insert into public.admin_users (user_id)
values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');

delete from public.guests;

insert into public.guests (id, name, phone, group_affiliation, status)
values (
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'Existing Test Guest',
  '0500000000',
  'Group One',
  'pending'
);

select ok(
  not has_table_privilege('authenticated', 'public.admin_users', 'select'),
  'authenticated has no SELECT privilege on admin_users'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'public.import_guests(jsonb, boolean)',
    'execute'
  ),
  'authenticated cannot execute import_guests'
);
select ok(
  has_function_privilege('service_role', 'public.import_guests(jsonb, boolean)', 'execute'),
  'service_role can execute import_guests'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","role":"authenticated"}',
  true
);
select set_config('request.jwt.claim.sub', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', true);

select is(
  (select count(*)::integer from public.guests),
  0,
  'non-admin authenticated cannot list guests'
);

select throws_ok(
  $$ insert into public.guests (name, status) values ('Hacker Guest', 'pending') $$,
  '42501',
  NULL,
  'non-admin authenticated cannot insert guests'
);

select is(
  public.is_current_user_admin(),
  false,
  'non-admin is_current_user_admin is false'
);

select throws_ok(
  $$ select * from public.admin_users $$,
  '42501',
  NULL,
  'non-admin cannot read admin_users'
);

select throws_ok(
  $$ select public.import_guests('[]'::jsonb, true) $$,
  '42501',
  NULL,
  'non-admin cannot execute import_guests'
);

update public.guests
set name = 'Hacked Name'
where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

reset role;

select is(
  (select name from public.guests where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'),
  'Existing Test Guest',
  'non-admin update of guests is a no-op'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","role":"authenticated"}',
  true
);
select set_config('request.jwt.claim.sub', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', true);

delete from public.guests where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

reset role;

select is(
  (select count(*)::integer from public.guests where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'),
  1,
  'non-admin delete of guests is a no-op'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);
select set_config('request.jwt.claim.sub', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', true);

select is(
  public.is_current_user_admin(),
  true,
  'admin is_current_user_admin is true'
);

select is(
  (select count(*)::integer from public.guests),
  1,
  'admin can list guests'
);

select lives_ok(
  $$ insert into public.guests (id, name, status)
     values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'Admin Added Guest', 'pending') $$,
  'admin can insert guests'
);

select lives_ok(
  $$ update public.guests
     set group_affiliation = 'Updated Group'
     where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' $$,
  'admin can update guests'
);

select lives_ok(
  $$ delete from public.guests where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee' $$,
  'admin can delete guests'
);

reset role;

select is(
  (select group_affiliation from public.guests where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'),
  'Updated Group',
  'admin update persisted'
);

set local role service_role;

select throws_ok(
  $$ select public.import_guests(
       '[{"name":"Import One","phone":"0500000011","group_affiliation":"Importers"}]'::jsonb,
       true
     ) $$,
  'P0001',
  NULL,
  'import_guests(require_empty=true) rejects a non-empty guests table'
);

reset role;

select is(
  (select count(*)::integer from public.guests),
  1,
  'failed require_empty import does not insert rows'
);

delete from public.guests;

alter table public.guests
  add constraint guests_test_unique_name unique (name);

set local role service_role;

select throws_ok(
  $$ select public.import_guests(
       '[
         {"name":"Dup Name","phone":"0500000021","group_affiliation":"A"},
         {"name":"Dup Name","phone":"0500000022","group_affiliation":"B"}
       ]'::jsonb,
       true
     ) $$,
  NULL,
  NULL,
  'an error during import_guests raises and aborts the function'
);

reset role;

select is(
  (select count(*)::integer from public.guests),
  0,
  'a failed import rolls back every inserted row'
);

alter table public.guests drop constraint guests_test_unique_name;

set local role service_role;

select is(
  public.import_guests(
    '[
      {"name":"Synthetic One","phone":"0500000031","group_affiliation":"A"},
      {"name":"Synthetic Two","phone":null,"group_affiliation":"B"}
    ]'::jsonb,
    true
  ),
  2,
  'successful import_guests returns the inserted count'
);

select * from finish();
rollback;
