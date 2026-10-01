-- Meridian migration 004 — enforce suspension at the RLS level.
--
-- Run AFTER migration-003 in the Supabase Dashboard: SQL Editor -> New query -> paste -> Run.
--
-- Problem fixed: suspension was only checked by the frontend at login. A suspended
-- user holding a still-valid JWT could keep reading and writing their own rows
-- directly through the API. After this migration every owner policy also requires
-- an active profile, so suspension takes effect on the next API call (fail-closed).
--
-- Design notes:
-- * profiles SELECT is intentionally left readable by the owner: the login flow
--   must read profiles.status to show the "account suspended" message. Every
--   other operation for a suspended user is frozen.
-- * public.is_active() is SECURITY DEFINER with a fixed search_path (like
--   is_admin()): it bypasses RLS so policies on other tables can call it
--   without recursion.
-- * is_admin() now also requires an active profile: a suspended admin loses
--   admin powers too. If you suspend your own admin account by mistake, restore
--   it with SQL:
--     update public.profiles set status = 'active' where email = 'you@example.com';

-- ---------- active check (security definer: bypasses RLS, no recursion) ----------
create or replace function public.is_active()
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and status = 'active'
  );
$$;

-- ---------- suspended admins lose admin powers ----------
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

-- ---------- wallet_balances: owners need an active profile ----------
drop policy if exists "Users manage own balances" on public.wallet_balances;
create policy "Users manage own balances"
  on public.wallet_balances for all
  using (auth.uid() = user_id and public.is_active());

-- ---------- transactions: owners need an active profile (still append-only) ----------
drop policy if exists "Users read own transactions" on public.transactions;
drop policy if exists "Users insert own transactions" on public.transactions;
create policy "Users read own transactions"
  on public.transactions for select
  using (auth.uid() = user_id and public.is_active());
create policy "Users insert own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id and public.is_active());

-- ---------- holdings: owners need an active profile ----------
drop policy if exists "Users manage own holdings" on public.holdings;
create policy "Users manage own holdings"
  on public.holdings for all
  using (auth.uid() = user_id and public.is_active());

-- ---------- plan_allocations: owners need an active profile ----------
drop policy if exists "Users manage own allocations" on public.plan_allocations;
create policy "Users manage own allocations"
  on public.plan_allocations for all
  using (auth.uid() = user_id and public.is_active());

-- ---------- profiles: updates frozen for suspended users (admins unaffected) ----------
-- SELECT is unchanged on purpose: the login flow reads profiles.status to show
-- the "account suspended" message.
drop policy if exists "Profiles updatable by owner or admin" on public.profiles;
create policy "Profiles updatable by owner or admin"
  on public.profiles for update
  using ((auth.uid() = id and public.is_active()) or public.is_admin())
  with check ((auth.uid() = id and public.is_active()) or public.is_admin());
