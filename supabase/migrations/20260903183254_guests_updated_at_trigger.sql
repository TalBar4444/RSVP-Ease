-- Keep guests.updated_at current on every row update (admin edits and RPCs).

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := timezone('utc'::text, now());
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public;

drop trigger if exists guests_set_updated_at on public.guests;

create trigger guests_set_updated_at
  before update on public.guests
  for each row
  execute function private.set_updated_at();
