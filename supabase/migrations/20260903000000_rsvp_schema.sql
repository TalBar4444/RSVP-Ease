-- Canonical, idempotent schema for both rsvp-db-dev and new production projects.
-- Apply migrations only through `supabase db push`.

create schema if not exists private;

create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  name text not null,
  phone text,
  status text not null default 'pending',
  guests_count integer not null default 0,
  children_count integer not null default 0,
  is_vegetarian boolean not null default false,
  is_vegan boolean not null default false,
  is_gluten_free boolean not null default false,
  other_dietary_notes text,
  group_affiliation text
);

comment on table public.guests is
  'Wedding invitees and their RSVP responses.';

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

comment on table public.admin_users is
  'Auth users allowed to manage guests. Insert a row after creating each admin in Authentication.';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.guests'::regclass
      and conname = 'guests_status_check'
  ) then
    alter table public.guests
      add constraint guests_status_check
      check (status in ('pending', 'attending', 'declined'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.guests'::regclass
      and conname = 'guests_adults_count_check'
  ) then
    alter table public.guests
      add constraint guests_adults_count_check
      check (guests_count >= 0 and guests_count <= 50);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.guests'::regclass
      and conname = 'guests_children_count_check'
  ) then
    alter table public.guests
      add constraint guests_children_count_check
      check (children_count >= 0 and children_count <= 50);
  end if;
end
$$;

alter table public.guests enable row level security;
alter table public.admin_users enable row level security;

revoke all on table public.guests from public, anon;
revoke all on table public.admin_users from public, anon, authenticated;

grant select, insert, update, delete on table public.guests to authenticated;
grant select, insert, update, delete on table public.guests to service_role;
grant select, insert, update, delete on table public.admin_users to service_role;

revoke truncate, trigger, references on table public.guests from authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_admin() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_admin();
$$;

revoke all on function public.is_current_user_admin() from public;
revoke all on function public.is_current_user_admin() from anon;
grant execute on function public.is_current_user_admin() to authenticated;

drop policy if exists "Allow anonymous select by ID" on public.guests;
drop policy if exists "Allow anonymous update by ID" on public.guests;
drop policy if exists "Allow anonymous insert" on public.guests;
drop policy if exists "Allow anonymous delete by ID" on public.guests;
drop policy if exists "admins_select_guests" on public.guests;
drop policy if exists "admins_insert_guests" on public.guests;
drop policy if exists "admins_update_guests" on public.guests;
drop policy if exists "admins_delete_guests" on public.guests;

create policy "admins_select_guests"
on public.guests
for select
to authenticated
using ( (select private.is_admin()) );

create policy "admins_insert_guests"
on public.guests
for insert
to authenticated
with check ( (select private.is_admin()) );

create policy "admins_update_guests"
on public.guests
for update
to authenticated
using ( (select private.is_admin()) )
with check ( (select private.is_admin()) );

create policy "admins_delete_guests"
on public.guests
for delete
to authenticated
using ( (select private.is_admin()) );

create or replace function public.get_guest(guest_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if guest_id is null then
    return null;
  end if;

  select jsonb_build_object(
    'id', g.id,
    'name', g.name,
    'status', g.status,
    'guests_count', g.guests_count,
    'children_count', g.children_count,
    'is_vegetarian', g.is_vegetarian,
    'is_vegan', g.is_vegan,
    'is_gluten_free', g.is_gluten_free,
    'other_dietary_notes', g.other_dietary_notes
  )
  into result
  from public.guests as g
  where g.id = guest_id;

  return result;
end;
$$;

create or replace function public.submit_rsvp(
  guest_id uuid,
  status text,
  guests_count integer,
  children_count integer,
  is_vegetarian boolean,
  is_vegan boolean,
  is_gluten_free boolean,
  other_dietary_notes text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  attending boolean;
  next_adults integer;
  next_children integer;
  next_notes text;
begin
  if guest_id is null then
    raise exception 'Guest id is required';
  end if;

  if status not in ('attending', 'declined') then
    raise exception 'Invalid RSVP status';
  end if;

  attending := (status = 'attending');
  next_adults := case when attending then guests_count else 0 end;
  next_children := case when attending then children_count else 0 end;
  next_notes := case
    when attending then nullif(btrim(coalesce(other_dietary_notes, '')), '')
    else null
  end;

  if attending then
    if next_adults is null or next_adults < 1 or next_adults > 50 then
      raise exception 'Invalid adult guest count';
    end if;
    if next_children is null or next_children < 0 or next_children > 50 then
      raise exception 'Invalid children count';
    end if;
  end if;

  update public.guests as g
  set
    status = submit_rsvp.status,
    guests_count = next_adults,
    children_count = next_children,
    is_vegetarian = attending and coalesce(submit_rsvp.is_vegetarian, false),
    is_vegan = attending and coalesce(submit_rsvp.is_vegan, false),
    is_gluten_free = attending and coalesce(submit_rsvp.is_gluten_free, false),
    other_dietary_notes = next_notes,
    updated_at = timezone('utc'::text, now())
  where g.id = submit_rsvp.guest_id;

  if not found then
    raise exception 'Guest not found';
  end if;
end;
$$;

-- A single function call is one PostgreSQL transaction: either every row is
-- inserted or the whole import is rolled back.
-- When require_empty is true, the function raises an exception (rolling back)
-- if the guests table already contains rows. This prevents a TOCTOU race
-- between a pre-import count and the actual insert.
create or replace function public.import_guests(
  import_rows jsonb,
  require_empty boolean default true
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_count bigint;
  inserted_count integer;
begin
  if jsonb_typeof(import_rows) <> 'array' then
    raise exception 'import_rows must be a JSON array';
  end if;

  if require_empty then
    select count(*) into existing_count from public.guests;
    if existing_count > 0 then
      raise exception 'guests table already contains % row(s); import aborted inside transaction', existing_count;
    end if;
  end if;

  insert into public.guests (name, phone, group_affiliation, status)
  select
    coalesce(row_data.name, ''),
    nullif(row_data.phone, ''),
    nullif(row_data.group_affiliation, ''),
    'pending'
  from jsonb_to_recordset(import_rows) as row_data(
    name text,
    phone text,
    group_affiliation text
  );

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

revoke all on function public.get_guest(uuid) from public;
revoke all on function public.submit_rsvp(uuid, text, integer, integer, boolean, boolean, boolean, text) from public;
revoke all on function public.import_guests(jsonb, boolean) from public, anon, authenticated;

grant execute on function public.get_guest(uuid) to anon, authenticated;
grant execute on function public.submit_rsvp(uuid, text, integer, integer, boolean, boolean, boolean, text)
  to anon, authenticated;
grant execute on function public.import_guests(jsonb, boolean) to service_role;

notify pgrst, 'reload schema';
