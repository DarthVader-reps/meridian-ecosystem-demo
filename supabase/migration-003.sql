-- Meridian migration 003 — admin read access to ledger tables
--
-- Run AFTER migration-002 (depends on the public.is_admin() function).
-- Lets admin-role users read every row of the money tables so the admin
-- console can show platform-wide dashboards and ledgers. Regular users are
-- unaffected: their own-row policies still apply to them.
--
-- Run in the Supabase Dashboard: SQL Editor -> New query -> paste -> Run.

-- ---------- transactions ----------
drop policy if exists "Admins read all transactions" on public.transactions;
create policy "Admins read all transactions"
  on public.transactions for select
  using (public.is_admin());

-- ---------- wallet_balances ----------
drop policy if exists "Admins read all balances" on public.wallet_balances;
create policy "Admins read all balances"
  on public.wallet_balances for select
  using (public.is_admin());

-- ---------- holdings ----------
drop policy if exists "Admins read all holdings" on public.holdings;
create policy "Admins read all holdings"
  on public.holdings for select
  using (public.is_admin());

-- ---------- plan_allocations ----------
drop policy if exists "Admins read all allocations" on public.plan_allocations;
create policy "Admins read all allocations"
  on public.plan_allocations for select
  using (public.is_admin());
