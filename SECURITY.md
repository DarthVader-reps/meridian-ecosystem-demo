# Meridian demo — security notes

> This is a **simulated-funds front-end demo**. No real money, trades, deposits,
> or payouts exist anywhere in the system. Everything below is scoped to that
> threat model. See "Production gap" for what would be needed before real funds.

## What is enforced, and where

| Concern | Enforcement |
|---|---|
| Authentication | Supabase Auth (email/password). Sessions are real JWTs when Supabase is configured; a local demo adapter stands in otherwise. |
| Row ownership | Supabase RLS on all 5 tables (`profiles`, `wallet_balances`, `transactions`, `holdings`, `plan_allocations`). Users touch only their own rows. |
| Suspension | **Two layers.** Frontend blocks login with an explanatory message; migration `004` also enforces it in RLS via `public.is_active()`, so a suspended user with a still-valid JWT is frozen on the next API call. A suspended admin loses admin powers too. |
| Admin role | Granted only via SQL (`update profiles set role='admin' …`). `protect_profile_fields` trigger stops non-admins changing `role`/`status`. Admin reads use read-only RLS policies (`is_admin()`); there is no admin UI in the site build. |
| Ledger integrity | `transactions` is append-only at the RLS level (no update/delete policies). |
| Live market prices | BTC, ETH and SOL stream real prices (Kraken → CoinGecko fallback, 60s poll, no keys). The client never trusts a single feed — total failure falls back to seeded mock prices and the UI marks which symbols are live. |
| Server-side balances | Logged-in users' balances and ledger live in Supabase (`wallet_balances` / `transactions`); the client writes through optimistically and syncs on login. Admins can credit/debit via RLS-gated admin policies — every adjustment writes a ledger row with the reason as the audit trail. |
| Transaction freeze | `profiles.tx_frozen` blocks an owner's ledger inserts and balance writes at the RLS level (migration `005`, `public.is_frozen()`), while reads still work. The app mirrors the freeze with a friendly banner. Weaker than suspension (login still works) by design — it is the scalpel next to suspension's hammer. |
| XSS | No `dangerouslySetInnerHTML`, no `eval`, no inline event handlers. A Content-Security-Policy ships as a `<meta>` tag (GitHub Pages cannot send custom headers). |
| Secrets | No service-role key, API secret, or `.env` is committed. The Supabase **anon** key in the repo is public by design; RLS is the boundary. |
| Dependencies | Exact versions pinned in `package.json` (no ranges, no lockfile — the web uploader rejects the API payload size). CI reinstalls from scratch on every run. |

## Known limitations (accepted for the demo)

- **No admin console in the site build** (removed in build 10.1). Approvals,
  blocks, and suspensions are performed directly in Supabase (SQL); the site
  itself carries no admin UI, PIN, or mock admin data.
- **Simulated money math runs client-side.** An authenticated user can call
  their own allowed RLS rows directly; there are no server-side financial
  invariants. Balances moved server-side (build 6) so admins can control them,
  but the writes still originate from the client — fine for mock balances,
  disqualifying for real funds.
- **Price feeds are display-only.** Live quotes come from public exchange APIs
  with no authentication; a compromised feed could show wrong prices. Trades
  still settle against the displayed price at click time, so treat prices as
  informational.
- **No custom security headers.** GitHub Pages cannot send them; the meta-tag
  CSP is the mitigation (it cannot cover `frame-ancestors`).
- **Supabase dashboard settings** (MFA, leaked-password protection,
  email-confirmation, redirect allow-list) are outside this repo — verify them
  in the dashboard.

## Production gap — do not skip before real funds

1. Server-side ledger: all balance/position changes must happen in database
   functions or an API with transactional invariants, never by direct row writes.
2. Idempotency keys on every money movement; reconciliation jobs.
3. Real payment rails (Stripe etc.) with webhook verification — never trust the client.
4. KYC/AML, sanctions screening, audit logging, data retention policy.
5. ~~Remove the demo PIN path entirely~~ (done in build 10.1 — the console no longer ships); enforce MFA for admins.
6. Real security headers (HSTS, CSP `frame-ancestors`, etc.) via proper hosting.
7. Dependency scanning in CI (`npm audit` / OSV), lockfile committed.
8. Incident response plan and backup/restore drills for the database.

## Running the migrations

In Supabase Dashboard → SQL Editor, run in order, once each:

1. `supabase/schema.sql`
2. `supabase/migration-002.sql`
3. `supabase/migration-003.sql`
4. `supabase/migration-004.sql`
5. `supabase/migration-005.sql` — per-user `tx_frozen` flag, admin balance/ledger write policies, freeze-gated owner policies

Then grant yourself admin: `update public.profiles set role = 'admin' where email = 'you@example.com';`
