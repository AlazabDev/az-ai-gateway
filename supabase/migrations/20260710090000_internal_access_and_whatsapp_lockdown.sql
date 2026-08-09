-- Internal access and WhatsApp data lockdown.

create table if not exists public.internal_email_domains (
  domain text primary key,
  created_at timestamptz not null default now(),
  constraint internal_email_domains_normalized check (
    domain = lower(trim(domain))
    and domain ~ '^[a-z0-9.-]+\.[a-z]{2,}$'
  )
);

alter table public.internal_email_domains enable row level security;

insert into public.internal_email_domains (domain)
values
  ('alazab.com'),
  ('alazabgo.onmicrosoft.com')
on conflict (domain) do nothing;

drop policy if exists "Admins view internal email domains" on public.internal_email_domains;
drop policy if exists "Admins manage internal email domains" on public.internal_email_domains;

create policy "Admins view internal email domains"
on public.internal_email_domains
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins manage internal email domains"
on public.internal_email_domains
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create or replace function public.is_internal_email_allowed(_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.internal_email_domains
    where domain = split_part(lower(coalesce(_email, '')), '@', 2)
  );
$$;

revoke all on function public.is_internal_email_allowed(text) from public, anon, authenticated;

grant execute on function public.is_internal_email_allowed(text) to service_role;

create or replace function public.enforce_internal_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if new.email is null or not public.is_internal_email_allowed(new.email) then
    raise exception 'Account creation is restricted to approved Alazab domains'
      using errcode = '28000';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_internal_auth_user() from public, anon, authenticated;

drop trigger if exists enforce_internal_auth_user_before_insert on auth.users;
create trigger enforce_internal_auth_user_before_insert
before insert on auth.users
for each row execute function public.enforce_internal_auth_user();

-- WhatsApp messages are operational customer data and must be admin-only.
drop policy if exists "Authenticated users can read messages" on public.whatsapp_messages;
drop policy if exists "Admins can read WhatsApp messages" on public.whatsapp_messages;

create policy "Admins can read WhatsApp messages"
on public.whatsapp_messages
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- WhatsApp media must never be exposed through a public bucket.
update storage.buckets
set public = false
where id = 'whatsapp-media';

drop policy if exists "WhatsApp media publicly readable" on storage.objects;
drop policy if exists "Authenticated can read whatsapp media" on storage.objects;
drop policy if exists "Admins can read whatsapp media" on storage.objects;

create policy "Admins can read whatsapp media"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'whatsapp-media'
  and public.has_role(auth.uid(), 'admin')
);
