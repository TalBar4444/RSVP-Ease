-- Fold kids into guests_count, replace boolean diet flags with exclusive
-- plate counts (including kids meals), and drop leftover adults/kids artifacts.

alter table public.guests
  add column if not exists vegetarian_count integer not null default 0,
  add column if not exists vegan_count integer not null default 0,
  add column if not exists gluten_free_count integer not null default 0,
  add column if not exists kids_meal_count integer not null default 0;

do $$
declare
  r record;
  next_guests integer;
  next_veg integer;
  next_vegan integer;
  next_gf integer;
  next_kids integer;
  overflow integer;
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'guests'
      and column_name = 'children_count'
  ) then
    return;
  end if;

  for r in
    select
      id,
      guests_count,
      children_count,
      is_vegetarian,
      is_vegan,
      is_gluten_free
    from public.guests
  loop
    next_guests := least(50, r.guests_count + r.children_count);
    next_kids := r.children_count;
    next_veg := case when r.is_vegetarian then 1 else 0 end;
    next_vegan := case when r.is_vegan then 1 else 0 end;
    next_gf := case when r.is_gluten_free then 1 else 0 end;
    overflow := (next_veg + next_vegan + next_gf + next_kids) - next_guests;

    if overflow > 0 then
      if next_kids >= overflow then
        next_kids := next_kids - overflow;
        overflow := 0;
      else
        overflow := overflow - next_kids;
        next_kids := 0;
      end if;
    end if;

    if overflow > 0 then
      if next_gf >= overflow then
        next_gf := next_gf - overflow;
        overflow := 0;
      else
        overflow := overflow - next_gf;
        next_gf := 0;
      end if;
    end if;

    if overflow > 0 then
      if next_vegan >= overflow then
        next_vegan := next_vegan - overflow;
        overflow := 0;
      else
        overflow := overflow - next_vegan;
        next_vegan := 0;
      end if;
    end if;

    if overflow > 0 then
      next_veg := greatest(0, next_veg - overflow);
    end if;

    update public.guests
    set
      guests_count = next_guests,
      vegetarian_count = next_veg,
      vegan_count = next_vegan,
      gluten_free_count = next_gf,
      kids_meal_count = next_kids
    where id = r.id;
  end loop;
end
$$;

alter table public.guests drop constraint if exists guests_children_count_check;
alter table public.guests drop constraint if exists guests_adults_count_check;

alter table public.guests drop column if exists children_count;
alter table public.guests drop column if exists is_vegetarian;
alter table public.guests drop column if exists is_vegan;
alter table public.guests drop column if exists is_gluten_free;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.guests'::regclass
      and conname = 'guests_count_check'
  ) then
    alter table public.guests
      add constraint guests_count_check
      check (guests_count >= 0 and guests_count <= 50);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.guests'::regclass
      and conname = 'guests_vegetarian_count_check'
  ) then
    alter table public.guests
      add constraint guests_vegetarian_count_check
      check (vegetarian_count >= 0 and vegetarian_count <= 50);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.guests'::regclass
      and conname = 'guests_vegan_count_check'
  ) then
    alter table public.guests
      add constraint guests_vegan_count_check
      check (vegan_count >= 0 and vegan_count <= 50);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.guests'::regclass
      and conname = 'guests_gluten_free_count_check'
  ) then
    alter table public.guests
      add constraint guests_gluten_free_count_check
      check (gluten_free_count >= 0 and gluten_free_count <= 50);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.guests'::regclass
      and conname = 'guests_kids_meal_count_check'
  ) then
    alter table public.guests
      add constraint guests_kids_meal_count_check
      check (kids_meal_count >= 0 and kids_meal_count <= 50);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.guests'::regclass
      and conname = 'guests_special_meals_count_check'
  ) then
    alter table public.guests
      add constraint guests_special_meals_count_check
      check (
        vegetarian_count + vegan_count + gluten_free_count + kids_meal_count
        <= guests_count
      );
  end if;
end
$$;

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
    'vegetarian_count', g.vegetarian_count,
    'vegan_count', g.vegan_count,
    'gluten_free_count', g.gluten_free_count,
    'kids_meal_count', g.kids_meal_count,
    'other_dietary_notes', g.other_dietary_notes
  )
  into result
  from public.guests as g
  where g.id = guest_id;

  return result;
end;
$$;

drop function if exists public.submit_rsvp(
  uuid,
  text,
  integer,
  integer,
  boolean,
  boolean,
  boolean,
  text
);

create function public.submit_rsvp(
  guest_id uuid,
  status text,
  guests_count integer,
  vegetarian_count integer,
  vegan_count integer,
  gluten_free_count integer,
  kids_meal_count integer,
  other_dietary_notes text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  attending boolean;
  next_guests integer;
  next_vegetarian integer;
  next_vegan integer;
  next_gluten integer;
  next_kids integer;
  next_notes text;
begin
  if guest_id is null then
    raise exception 'Guest id is required';
  end if;

  if status not in ('attending', 'declined') then
    raise exception 'Invalid RSVP status';
  end if;

  attending := (status = 'attending');
  next_guests := case when attending then guests_count else 0 end;
  next_vegetarian := case when attending then coalesce(vegetarian_count, 0) else 0 end;
  next_vegan := case when attending then coalesce(vegan_count, 0) else 0 end;
  next_gluten := case when attending then coalesce(gluten_free_count, 0) else 0 end;
  next_kids := case when attending then coalesce(kids_meal_count, 0) else 0 end;
  next_notes := case
    when attending then nullif(btrim(coalesce(other_dietary_notes, '')), '')
    else null
  end;

  if attending then
    if next_guests is null or next_guests < 1 or next_guests > 50 then
      raise exception 'Invalid guest count';
    end if;
    if
      next_vegetarian is null or next_vegetarian < 0 or next_vegetarian > 50
      or next_vegan is null or next_vegan < 0 or next_vegan > 50
      or next_gluten is null or next_gluten < 0 or next_gluten > 50
      or next_kids is null or next_kids < 0 or next_kids > 50
      or next_vegetarian + next_vegan + next_gluten + next_kids > next_guests
    then
      raise exception 'Invalid special meal counts';
    end if;
  end if;

  update public.guests as g
  set
    status = submit_rsvp.status,
    guests_count = next_guests,
    vegetarian_count = next_vegetarian,
    vegan_count = next_vegan,
    gluten_free_count = next_gluten,
    kids_meal_count = next_kids,
    other_dietary_notes = next_notes,
    updated_at = timezone('utc'::text, now())
  where g.id = submit_rsvp.guest_id;

  if not found then
    raise exception 'Guest not found';
  end if;
end;
$$;

revoke all on function public.submit_rsvp(
  uuid,
  text,
  integer,
  integer,
  integer,
  integer,
  integer,
  text
) from public;

grant execute on function public.submit_rsvp(
  uuid,
  text,
  integer,
  integer,
  integer,
  integer,
  integer,
  text
) to anon, authenticated;

notify pgrst, 'reload schema';
