-- Meridian backend schema for Supabase (Postgres).
-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
--
-- Design notes:
--  * Every table carries user_id and is locked down by Row Level Security:
--    a signed-in user can only touch their own rows. There is no way for the
--    frontend to read or write another user's data, even with the anon key.
--  * transactions is APPEND-ONLY: RLS allows INSERT and SELECT but no
--    UPDATE/DELETE, so the money ledger cannot be rewritten after the fact.
--  * profiles rows are auto-created by a trigger when a user signs up.

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  created_at timestamptz not null default now()
);

-- ---------- wallet_balances ----------
create table if not exists public.wallet_balances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  asset text not null,
  balance numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, asset)
);

-- ---------- transactions (append-only ledger) ----------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('deposit', 'withdraw', 'transfer', 'swap', 'trade')),
  asset text not null,
  amount numeric not null,
  detail text,
  created_at timestamptz not null default now()
);

-- ---------- holdings ----------
create table if not exists public.holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  symbol text not null,
  qty numeric not null default 0,
  avg_price numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, symbol)
);

-- ---------- plan_allocations ----------
create table if not exists public.plan_allocations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id text not null,
  amount numeric not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- auto-create profile on signup ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;
alter table public.wallet_balances enable row level security;
alter table public.transactions enable row level security;
alter table public.holdings enable row level security;
alter table public.plan_allocations enable row level security;

-- profiles: read/update own row only
create policy "Users read own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile"
  on public.profiles for update using (auth.uid() = id);

-- wallet_balances: full access to own rows only
create policy "Users manage own balances"
  on public.wallet_balances for all using (auth.uid() = user_id);

-- transactions: insert + read own rows; NO update/delete (append-only)
create policy "Users read own transactions"
  on public.transactions for select using (auth.uid() = user_id);
create policy "Users insert own transactions"
  on public.transactions for insert with check (auth.uid() = user_id);

-- holdings: full access to own rows only
create policy "Users manage own holdings"
  on public.holdings for all using (auth.uid() = user_id);

-- plan_allocations: full access to own rows only
create policy "Users manage own allocations"
  on public.plan_allocations for all using (auth.uid() = user_id);
