begin;
select plan(15);

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
  'admin-outreach@example.test'
);
select pg_temp.create_auth_user(
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'guest-outreach@example.test'
);

insert into public.admin_users (user_id)
values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');

delete from public.guests;

insert into public.guests (id, name, phone, status)
values (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Outreach Test Guest',
  '0500000099',
  'pending'
);

create temp table outreach_guest_baseline as
select id, updated_at
from public.guests
where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

set local role anon;

select lives_ok(
  $$ select public.record_link_open('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') $$,
  'anon record_link_open on a real guest succeeds'
);

select lives_ok(
  $$ select public.record_link_open('ffffffff-ffff-4fff-8fff-ffffffffffff') $$,
  'anon record_link_open on an unknown uuid is a no-op'
);

select lives_ok(
  $$ select public.record_link_open(null) $$,
  'anon record_link_open(null) is a no-op'
);

reset role;

select is(
  (select count(*)::integer from public.guest_link_opens),
  1,
  'first open inserts one guest_link_opens row'
);

select is(
  (select guest_id from public.guest_link_opens),
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
  'open is recorded for the matching guest'
);

select is(
  (select g.updated_at from public.guests as g where g.id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  (select b.updated_at from outreach_guest_baseline as b),
  'record_link_open does not bump guests.updated_at'
);

create temp table first_open as
select opened_at
from public.guest_link_opens
where guest_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

set local role anon;

select lives_ok(
  $$ select public.record_link_open('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') $$,
  'second record_link_open is ignored'
);

reset role;

select is(
  (select count(*)::integer from public.guest_link_opens),
  1,
  'first-open is idempotent'
);

select is(
  (select opened_at from public.guest_link_opens where guest_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  (select opened_at from first_open),
  'repeat record_link_open keeps the original opened_at'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","role":"authenticated"}',
  true
);
select set_config('request.jwt.claim.sub', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', true);

select throws_ok(
  $$ insert into public.guest_message_sends (guest_id, message_type, channel)
     values (
       'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
       'invitation',
       'whatsapp'
     ) $$,
  '42501',
  NULL,
  'non-admin authenticated cannot insert guest_message_sends'
);

select is(
  (select count(*)::integer from public.guest_message_sends),
  0,
  'non-admin cannot list guest_message_sends'
);

reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);
select set_config('request.jwt.claim.sub', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', true);

select lives_ok(
  $$ insert into public.guest_message_sends (guest_id, message_type, channel)
     values (
       'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
       'invitation',
       'whatsapp'
     ) $$,
  'admin can insert guest_message_sends'
);

select lives_ok(
  $$ insert into public.guest_message_sends (guest_id, message_type, channel)
     values (
       'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
       'invitation',
       'sms'
     )
     on conflict (guest_id, message_type)
     do update set channel = excluded.channel, sent_at = timezone('utc'::text, now()) $$,
  'admin can upsert guest_message_sends'
);

select is(
  (
    select channel
    from public.guest_message_sends
    where guest_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and message_type = 'invitation'
  ),
  'sms',
  'upsert updates channel on resend'
);

reset role;

delete from public.guests where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select is(
  (select count(*)::integer from public.guest_message_sends)
    + (select count(*)::integer from public.guest_link_opens),
  0,
  'deleting a guest cascades outreach rows'
);

select * from finish();
rollback;
