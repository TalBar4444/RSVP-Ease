-- Admin outreach tracking, kept off public.guests so send/open writes
-- do not bump guests.updated_at or collide with guest-edit conflict checks.

create table public.guest_message_sends (
  guest_id uuid not null references public.guests (id) on delete cascade,
  message_type text not null,
  channel text not null,
  sent_at timestamp with time zone not null default timezone('utc'::text, now()),
  primary key (guest_id, message_type),
  constraint guest_message_sends_type_check
    check (message_type in ('invitation', 'rsvp_reminder', 'day_of', 'thank_you')),
  constraint guest_message_sends_channel_check
    check (channel in ('whatsapp', 'sms', 'copy'))
);

comment on table public.guest_message_sends is
  'Latest outbound message per guest and template. Resend updates sent_at and channel.';

create table public.guest_link_opens (
  guest_id uuid primary key references public.guests (id) on delete cascade,
  opened_at timestamp with time zone not null default timezone('utc'::text, now())
);

comment on table public.guest_link_opens is
  'First time a guest loaded their RSVP page in a browser. First open wins.';

alter table public.guest_message_sends enable row level security;
alter table public.guest_link_opens enable row level security;

revoke all on table public.guest_message_sends from public, anon;
revoke all on table public.guest_link_opens from public, anon;

grant select, insert, update, delete on table public.guest_message_sends to authenticated;
grant select, insert, update, delete on table public.guest_message_sends to service_role;
grant select, insert, update, delete on table public.guest_link_opens to authenticated;
grant select, insert, update, delete on table public.guest_link_opens to service_role;

revoke truncate, trigger, references on table public.guest_message_sends from authenticated;
revoke truncate, trigger, references on table public.guest_link_opens from authenticated;

create policy "admins_select_guest_message_sends"
on public.guest_message_sends
for select
to authenticated
using ( (select private.is_admin()) );

create policy "admins_insert_guest_message_sends"
on public.guest_message_sends
for insert
to authenticated
with check ( (select private.is_admin()) );

create policy "admins_update_guest_message_sends"
on public.guest_message_sends
for update
to authenticated
using ( (select private.is_admin()) )
with check ( (select private.is_admin()) );

create policy "admins_delete_guest_message_sends"
on public.guest_message_sends
for delete
to authenticated
using ( (select private.is_admin()) );

create policy "admins_select_guest_link_opens"
on public.guest_link_opens
for select
to authenticated
using ( (select private.is_admin()) );

create policy "admins_insert_guest_link_opens"
on public.guest_link_opens
for insert
to authenticated
with check ( (select private.is_admin()) );

create policy "admins_update_guest_link_opens"
on public.guest_link_opens
for update
to authenticated
using ( (select private.is_admin()) )
with check ( (select private.is_admin()) );

create policy "admins_delete_guest_link_opens"
on public.guest_link_opens
for delete
to authenticated
using ( (select private.is_admin()) );

create or replace function public.record_link_open(guest_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if guest_id is null then
    return;
  end if;

  if not exists (
    select 1
    from public.guests as g
    where g.id = record_link_open.guest_id
  ) then
    return;
  end if;

  insert into public.guest_link_opens (guest_id)
  values (record_link_open.guest_id)
  on conflict on constraint guest_link_opens_pkey do nothing;
end;
$$;

comment on function public.record_link_open(uuid) is
  'Records the first RSVP-page open for a guest. Unknown ids are a no-op; repeats are ignored.';

revoke all on function public.record_link_open(uuid) from public;
grant execute on function public.record_link_open(uuid) to anon, authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'guest_message_sends'
  ) then
    alter publication supabase_realtime add table public.guest_message_sends;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'guest_link_opens'
  ) then
    alter publication supabase_realtime add table public.guest_link_opens;
  end if;
end
$$;

notify pgrst, 'reload schema';
