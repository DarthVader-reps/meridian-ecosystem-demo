-- Migration 002: admin roles, account status, profile emails.
-- Run in Supabase SQL Editor AFTER supabase/schema.sql.
--
-- What this adds:
--  * profiles.role ('user' | 'admin') and profiles.status ('active' | 'suspended')
--  * profiles.email, auto-filled by the signup trigger (admin console needs it;
--    auth.users is not readable with the anon key)
--  * is_admin() helper + RLS so admins can read/update every profile,
--    while regular users still only see their own row
--  * a trigger that stops non-admins from changing role/status on any row
--
-- AFTER running: make yourself admin with
--   update public.profiles set role = 'admin'
--   where email = 'you@example.com';

-- ---------- new columns ----------
alter table public.profiles
  add column if not exists role text not null default 'user'
    check (role in ('user', 'admin'));
alter table public.profiles
  add column if not exists status text not null default 'active'
    check (status in ('active', 'suspended'));
alter table public.profiles
  add column if not exists email text;

-- ---------- admin check (security definer: bypasses RLS, no recursion) ----------
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------- signup trigger now also stores the email ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    new.email
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

-- backfill emails for profiles created before this migration
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

-- ---------- RLS: owners see own row, admins see all ----------
drop policy if exists "Users read own profile" on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;

create policy "Profiles readable by owner or admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "Profiles updatable by owner or admin"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- ---------- guard: only admins (or service role) may change role/status ----------
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
as $$
begin
  -- service_role / SQL editor: no JWT, RLS is bypassed anyway
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if new.role is distinct from old.role then
    raise exception 'Only admins can change role';
  end if;
  if new.status is distinct from old.status then
    raise exception 'Only admins can change status';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_fields on public.profiles;
create trigger protect_profile_fields
  before update on public.profiles
  for each row execute procedure public.protect_profile_fields();
