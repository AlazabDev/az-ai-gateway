-- Fix user_roles policies and has_role function to prevent permission denied and recursion errors

drop policy if exists "Users view own roles" on public.user_roles;
drop policy if exists "Admins manage roles" on public.user_roles;
drop policy if exists "Service role full access on user_roles" on public.user_roles;

-- Recreate has_role securely with search_path set
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

-- Simple non-recursive policy for user_roles
create policy "Users view own roles" 
  on public.user_roles 
  for select 
  to authenticated 
  using (auth.uid() = user_id);

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
