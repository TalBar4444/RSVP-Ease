-- Manual DEV-only snippet. Do not run against production.
-- Applied once to rsvp-db-dev (with COMMIT) after an explicit approval.
-- This file still ends in ROLLBACK so it cannot wipe a database if pasted as-is.
--
-- Purpose: replace current DEV guests with the same synthetic set used by local seed.sql.
-- The real spreadsheet remains the source of truth and is not deleted by this script.
--
-- Safe sequence if approved later:
-- 1. Confirm the target project ref is DEV, not production.
-- 2. Export a backup copy of public.guests (SQL or CSV) and store it outside the repo.
-- 3. Run this script in a single transaction.
-- 4. If anything looks wrong, ROLLBACK. Only COMMIT after a row-count check.
--
-- This script is intentionally not wired to `supabase db reset --linked`.

begin;

-- Abort if this session is not on the expected DEV project. Replace the ref
-- before any approved run. Example check via dashboard SQL comments only.
-- select current_database();

create table if not exists public.guests_dev_backup_20260903 as
table public.guests;

delete from public.guests;

insert into public.guests (
  id,
  name,
  phone,
  status,
  guests_count,
  children_count,
  is_vegetarian,
  is_vegan,
  is_gluten_free,
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
    false,
    false,
    false,
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
    false,
    false,
    false,
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
    false,
    false,
    false,
    null,
    'Work'
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    'Test Family With Children',
    '0500000004',
    'attending',
    2,
    3,
    false,
    false,
    false,
    null,
    'Family South'
  ),
  (
    '55555555-5555-4555-8555-555555555555',
    'Test Dietary Guest',
    '0500000005',
    'attending',
    1,
    0,
    true,
    false,
    true,
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
    false,
    false,
    false,
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
    false,
    false,
    false,
    null,
    'משפחה'
  );

-- Inspect before replacing rollback with commit:
-- select count(*) from public.guests;
-- select count(*) from public.guests_dev_backup_20260903;

rollback;
-- After an approved review, re-run and replace the line above with: commit;
