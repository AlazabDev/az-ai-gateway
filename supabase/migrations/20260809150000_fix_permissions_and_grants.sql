-- Fix permissions, RLS policies, and table grants for user_roles and profiles

-- Grant schema usage
grant usage on schema public to anon, authenticated, service_role;

-- Grant table permissions
grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;

-- Ensure default privileges for future tables
alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated, service_role;
alter default privileges in schema public grant usage, select on sequences to anon, authenticated, service_role;

-- Recreate has_role securely
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 
    from public.user_roles 
    where user_id = _user_id 
      and role = _role
  );
$$;

-- Drop existing policies on user_roles
drop policy if exists "Users view own roles" on public.user_roles;
drop policy if exists "Admins manage roles" on public.user_roles;
drop policy if exists "Service role full access on user_roles" on public.user_roles;
drop policy if exists "Allow read user_roles" on public.user_roles;

-- Enable RLS
alter table public.user_roles enable row level security;

-- Create robust policies for user_roles
create policy "Users view own roles"
  on public.user_roles
  for select
  to authenticated
  using (auth.uid() = user_id or auth.role() = 'service_role');

create policy "Admins manage roles"
  on public.user_roles
  for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Service role full access on user_roles"
  on public.user_roles
  for all
  to service_role
  using (true)
  with check (true);

-- Ensure any existing users in auth.users have a role in public.user_roles
insert into public.user_roles (user_id, role)
select id, 'user'::public.app_role
from auth.users
on conflict (user_id, role) do nothing;
