-- Comprehensive fix for table permissions and RLS policies

-- 1. Grant usage and privileges
grant usage on schema public to anon, authenticated, service_role;
grant all privileges on all tables in schema public to anon, authenticated, service_role;
grant all privileges on all sequences in schema public to anon, authenticated, service_role;

alter default privileges in schema public grant all privileges on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all privileges on sequences to anon, authenticated, service_role;

-- 2. Fix user_roles table RLS and grants
create table if not exists public.user_roles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

drop policy if exists "Users view own roles" on public.user_roles;
drop policy if exists "Admins manage roles" on public.user_roles;
drop policy if exists "Service role full access on user_roles" on public.user_roles;
drop policy if exists "Allow select user_roles" on public.user_roles;

create policy "Allow select user_roles"
  on public.user_roles
  for select
  to authenticated, anon, service_role
  using (true);

create policy "Admins manage roles"
  on public.user_roles
  for all
  to authenticated
  using (auth.uid() = user_id or auth.role() = 'service_role')
  with check (auth.uid() = user_id or auth.role() = 'service_role');

-- 3. Fix chat_sessions table RLS and grants
create table if not exists public.chat_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'New Chat',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.chat_sessions enable row level security;

drop policy if exists "Users manage own sessions" on public.chat_sessions;
drop policy if exists "Allow all chat_sessions" on public.chat_sessions;

create policy "Allow all chat_sessions"
  on public.chat_sessions
  for all
  to authenticated, service_role
  using (auth.uid() = user_id or auth.role() = 'service_role')
  with check (auth.uid() = user_id or auth.role() = 'service_role');
