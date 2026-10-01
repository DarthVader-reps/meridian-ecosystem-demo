-- Meridian migration 005 — admin money controls + per-user transaction freeze.
--
-- Run AFTER migration-004 in the Supabase Dashboard: SQL Editor -> New query -> paste -> Run.
--
-- What this adds:
--   1. profiles.tx_frozen — per-user transaction freeze. While true, the owner
--      cannot insert ledger rows or write balances (RLS-enforced, fail-closed).
--      Reads still work so the user can see their money; only new activity stops.
--      This is the scalpel next to suspension's hammer (suspension blocks login
--      and all data access; freeze blocks only money movement).
--   2. Admin write access to wallet_balances — lets the admin console credit /
--      debit any user's balance. Every adjustment is paired with a ledger row
--      (see below) so the audit trail is complete.
--   3. Admin insert access to transactions — the credit/debit ledger entries.
--
-- Design notes:
-- * The owner wallet_balances policy is split from FOR ALL into per-operation
--   policies so a frozen user keeps read access while writes are blocked.
-- * Admins bypass the freeze (they are the ones who set it), but a suspended
--   admin still loses all powers via is_admin()'s active check (migration-004).
-- * App-level guards in the wallet store mirror the RLS freeze so frozen users
--   get a friendly message instead of a failed write.

-- ---------- per-user freeze flag ----------
alter table public.profiles
  add column if not exists tx_frozen boolean not null default false;

-- ---------- frozen check (security definer: bypasses RLS, no recursion) ----------
create or replace function public.is_frozen()
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and tx_frozen = true
  );
$$;

-- ---------- wallet_balances: split owner policy, add admin access ----------
drop policy if exists "Users manage own balances" on public.wallet_balances;

create policy "Users read own balances"
  on public.wallet_balances for select
  using (auth.uid() = user_id and public.is_active());

create policy "Users insert own balances"
  on public.wallet_balances for insert
  with check (auth.uid() = user_id and public.is_active() and not public.is_frozen());

create policy "Users update own balances"
  on public.wallet_balances for update
  using (auth.uid() = user_id and public.is_active())
  with check (auth.uid() = user_id and public.is_active() and not public.is_frozen());

create policy "Users delete own balances"
  on public.wallet_balances for delete
  using (auth.uid() = user_id and public.is_active() and not public.is_frozen());

create policy "Admins manage balances"
  on public.wallet_balances for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- transactions: freeze-gate owner inserts, admin audit inserts ----------
drop policy if exists "Users insert own transactions" on public.transactions;

create policy "Users insert own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id and public.is_active() and not public.is_frozen());

create policy "Admins insert transactions"
  on public.transactions for insert
  with check (public.is_admin());
