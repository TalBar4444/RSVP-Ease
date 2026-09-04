begin;
select plan(3);

delete from public.guests;

insert into public.guests (
  id,
  name,
  status,
  updated_at
) values (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
  'Updated At Fixture',
  'pending',
  '2020-01-01 00:00:00+00'
);

select is(
  (select updated_at from public.guests where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01'),
  '2020-01-01 00:00:00+00'::timestamptz,
  'insert can set a historical updated_at without the update trigger'
);

update public.guests
set group_affiliation = 'Touched'
where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01';

select ok(
  (
    select updated_at > timestamptz '2020-01-01 00:00:00+00'
    from public.guests
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01'
  ),
  'admin-style column updates refresh updated_at'
);

select public.submit_rsvp(
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
  'attending',
  1,
  0,
  false,
  false,
  false,
  null
);

select ok(
  (
    select updated_at > timestamptz '2020-01-01 00:00:00+00'
      and status = 'attending'
    from public.guests
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01'
  ),
  'submit_rsvp also leaves updated_at current'
);

select * from finish();
rollback;
