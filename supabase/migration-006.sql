-- migration-006.sql: deposit requests with admin clearance.
--
-- New sign-ups start at zero (no opening balances), so wallets are funded
-- through deposits. A deposit is only credited after an admin clears it:
-- the request flows awaiting -> confirming -> pending_clearance, and an
-- admin flips it to cleared (credit) or rejected via the functions below.
-- Users can advance their own requests through the confirmation flow but
-- can never mark them cleared/rejected themselves.

create table if not exists public.deposit_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  asset text not null,
  network text not null,
  amount numeric not null check (amount > 0),
  address text not null,
  status text not null default 'awaiting'
    check (status in ('awaiting', 'confirming', 'pending_clearance', 'cleared', 'rejected', 'expired', 'cancelled')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references auth.users (id)
);

alter table public.deposit_requests enable row level security;

drop policy if exists "Users read own deposit requests" on public.deposit_requests;
create policy "Users read own deposit requests"
  on public.deposit_requests for select
  using (auth.uid() = user_id and public.is_active());

drop policy if exists "Users insert own deposit requests" on public.deposit_requests;
create policy "Users insert own deposit requests"
  on public.deposit_requests for insert
  with check (auth.uid() = user_id and public.is_active());

-- Users may advance their own requests (awaiting -> confirming ->
-- pending_clearance / expired / cancelled) but can never clear or reject.
drop policy if exists "Users advance own deposit requests" on public.deposit_requests;
create policy "Users advance own deposit requests"
  on public.deposit_requests for update
  using (auth.uid() = user_id and public.is_active())
  with check (auth.uid() = user_id and public.is_active() and status not in ('cleared', 'rejected'));

drop policy if exists "Admins manage deposit requests" on public.deposit_requests;
create policy "Admins manage deposit requests"
  on public.deposit_requests for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- admin decisions (atomic: decision + credit + ledger) ----------

create or replace function public.clear_deposit_request(p_request_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid;
  v_asset text;
  v_amount numeric;
begin
  if not public.is_admin() then
    raise exception 'Admin only.';
  end if;
  select user_id, asset, amount into v_user_id, v_asset, v_amount
  from public.deposit_requests
  where id = p_request_id and status = 'pending_clearance';
  if not found then
    raise exception 'Deposit request is not pending clearance.';
  end if;
  update public.deposit_requests
  set status = 'cleared', decided_at = now(), decided_by = auth.uid()
  where id = p_request_id;
  insert into public.wallet_balances (user_id, asset, balance)
  values (v_user_id, v_asset, v_amount)
  on conflict (user_id, asset)
  do update set balance = public.wallet_balances.balance + excluded.balance;
  insert into public.transactions (user_id, type, asset, amount, detail)
  values (v_user_id, 'deposit', v_asset, v_amount, 'Deposit cleared by admin');
end;
$$;

create or replace function public.reject_deposit_request(p_request_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin only.';
  end if;
  update public.deposit_requests
  set status = 'rejected', decided_at = now(), decided_by = auth.uid()
  where id = p_request_id and status = 'pending_clearance';
  if not found then
    raise exception 'Deposit request is not pending clearance.';
  end if;
end;
$$;
