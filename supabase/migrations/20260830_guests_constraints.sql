-- Harden guests table: valid status/counts, and drop extra privileges
-- that authenticated does not need (TRUNCATE is not covered by RLS).

alter table public.guests
  add constraint guests_status_check
  check (status in ('pending', 'attending', 'declined'));

alter table public.guests
  add constraint guests_adults_count_check
  check (guests_count >= 0 and guests_count <= 50);

alter table public.guests
  add constraint guests_children_count_check
  check (children_count >= 0 and children_count <= 50);

revoke truncate, trigger, references on table public.guests from authenticated;
