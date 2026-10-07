-- Synthetic guests for local `supabase db reset` only.
-- Names, phones, and groups are fake. Do not copy real invitees into this file.

insert into public.guests (
  id,
  name,
  phone,
  status,
  guests_count,
  vegetarian_count,
  vegan_count,
  gluten_free_count,
  kids_meal_count,
  other_dietary_notes,
  group_affiliation
) values
  (
    '11111111-1111-4111-8111-111111111111',
    'Test Pending Guest',
    '0500000001',
    'pending',
    0,
    0,
    0,
    0,
    0,
    null,
    'Family North'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'Test Attending Couple',
    '0500000002',
    'attending',
    2,
    0,
    0,
    0,
    0,
    null,
    'Friends'
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'Test Declined Guest',
    '0500000003',
    'declined',
    0,
    0,
    0,
    0,
    0,
    null,
    'Work'
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    'Test Family With Children',
    '0500000004',
    'attending',
    5,
    0,
    0,
    0,
    3,
    null,
    'Family South'
  ),
  (
    '55555555-5555-4555-8555-555555555555',
    'Test Dietary Guest',
    '0500000005',
    'attending',
    1,
    1,
    0,
    0,
    0,
    'Peanut allergy — keep plating separate',
    'Friends'
  ),
  (
    '66666666-6666-4666-8666-666666666666',
    'Test Guest Without Phone',
    null,
    'pending',
    0,
    0,
    0,
    0,
    0,
    null,
    'Work'
  ),
  (
    '77777777-7777-4777-8777-777777777777',
    'אורחת בדיקה עם שם בעברית ארוך במיוחד לבדיקת תצוגה',
    '0500000007',
    'pending',
    0,
    0,
    0,
    0,
    0,
    null,
    'משפחה'
  );
