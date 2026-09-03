select n.nspname as schema, c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname in ('public', 'private')
  and c.relkind = 'r'
order by 1, 2;

select conrelid::regclass as table_name, conname, contype, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid in ('public.guests'::regclass, 'public.admin_users'::regclass)
order by 1, 2;

select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname in ('public', 'private')
order by tablename, policyname;

select n.nspname as schema, p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as args,
       p.prosecdef as security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('public', 'private')
order by 1, 2;

select grantee, table_schema, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('guests', 'admin_users')
  and grantee in ('anon', 'authenticated', 'service_role', 'public')
order by table_name, grantee, privilege_type;

select grantee, routine_schema, routine_name, privilege_type
from information_schema.routine_privileges
where routine_schema in ('public', 'private')
  and grantee in ('anon', 'authenticated', 'service_role', 'public')
order by routine_name, grantee;

select count(*) as synthetic_guest_count from public.guests;
