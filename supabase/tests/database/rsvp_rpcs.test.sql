begin;
select plan(13);

delete from public.guests;

insert into public.guests (
  id,
  name,
  phone,
  group_affiliation,
  status,
  guests_count,
  vegetarian_count,
  vegan_count,
  gluten_free_count,
  kids_meal_count,
  other_dietary_notes
) values (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Test Guest Public Api',
  '0500000099',
  'Secret Group',
  'pending',
  0,
  0,
  0,
  0,
  0,
  null
);

set local role anon;

select ok(
  public.get_guest('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') is not null,
  'get_guest(valid uuid) returns a guest'
);

select is(
  public.get_guest('ffffffff-ffff-4fff-8fff-ffffffffffff'),
  null,
  'get_guest(unknown uuid) returns null'
);

select is(
  (
    select array_agg(key order by key)
    from jsonb_object_keys(
      public.get_guest('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
    ) as key
  ),
  array[
    'gluten_free_count',
    'guests_count',
    'id',
    'kids_meal_count',
    'name',
    'other_dietary_notes',
    'status',
    'vegan_count',
    'vegetarian_count'
  ]::text[],
  'get_guest returns only the intended public fields'
);

select ok(
  not (public.get_guest('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') ? 'phone')
  and not (public.get_guest('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') ? 'group_affiliation')
  and not (public.get_guest('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') ? 'created_at')
  and not (public.get_guest('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') ? 'updated_at'),
  'get_guest never exposes phone, group, or timestamps'
);

select throws_ok(
  $$ select public.submit_rsvp(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'pending',
    2, 0, 0, 0, 0, null
  ) $$,
  'P0001',
  'Invalid RSVP status',
  'submit_rsvp rejects pending as a submission status'
);

select throws_ok(
  $$ select public.submit_rsvp(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'attending',
    0, 0, 0, 0, 0, null
  ) $$,
  'P0001',
  'Invalid guest count',
  'submit_rsvp rejects attending with 0 guests'
);

select throws_ok(
  $$ select public.submit_rsvp(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'attending',
    51, 0, 0, 0, 0, null
  ) $$,
  'P0001',
  'Invalid guest count',
  'submit_rsvp rejects attending with more than 50 guests'
);

select throws_ok(
  $$ select public.submit_rsvp(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'attending',
    2, 2, 1, 0, 0, null
  ) $$,
  'P0001',
  'Invalid special meal counts',
  'submit_rsvp rejects a special-meal total above guests_count'
);

select throws_ok(
  $$ select public.submit_rsvp(
    'ffffffff-ffff-4fff-8fff-ffffffffffff',
    'attending',
    2, 0, 0, 0, 0, null
  ) $$,
  'P0001',
  'Guest not found',
  'submit_rsvp rejects an unknown guest uuid'
);

select lives_ok(
  $$ select public.submit_rsvp(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'attending',
    2, 1, 0, 1, 0, 'nut allergy'
  ) $$,
  'submit_rsvp accepts a valid attending response'
);

reset role;

select is(
  (
    select row(
      name,
      phone,
      group_affiliation,
      status,
      guests_count,
      vegetarian_count,
      vegan_count,
      gluten_free_count,
      kids_meal_count,
      other_dietary_notes
    )
    from public.guests
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ),
  row(
    'Test Guest Public Api'::text,
    '0500000099'::text,
    'Secret Group'::text,
    'attending'::text,
    2,
    1,
    0,
    1,
    0,
    'nut allergy'::text
  ),
  'submit_rsvp updates only RSVP fields and leaves name, phone, and group unchanged'
);

set local role anon;

select lives_ok(
  $$ select public.submit_rsvp(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'declined',
    99, 1, 1, 1, 1, 'should be cleared'
  ) $$,
  'submit_rsvp accepts declined and ignores counts/diet from the payload'
);

reset role;

select is(
  (
    select row(status, guests_count, vegetarian_count, kids_meal_count, other_dietary_notes, phone)
    from public.guests
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ),
  row('declined'::text, 0, 0, 0, null::text, '0500000099'::text),
  'declining clears RSVP counts and diet without changing phone'
);

select * from finish();
rollback;
