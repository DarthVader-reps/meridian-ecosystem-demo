# Meridian Ecosystem Demo — Build Report

**Date:** 2026-09-29
**Location:** `~/workspace/meridian-ecosystem-demo`
**Status:** Built locally. `npm run build` succeeds. All tests pass.

> **Demo disclaimer.** Everything in this app is simulated with mock data and
> local browser state. No real money, payments, markets, or identity checks.

## Deliverables

- Working source in `~/workspace/meridian-ecosystem-demo` (Vite + React + TS)
- Production build in `dist/` (base `/meridian-ecosystem-demo/`, HashRouter)
- Downloadable archive: `~/workspace/meridian-ecosystem-demo/dist.zip` (225 KB)
- This report: `REPORT.md`. Run/deploy/brand docs: `README.md`.

**Note on preview URL:** GitHub repo creation via the connected App is blocked
(403 "Resource not accessible by integration"), so no Pages deploy was possible.
Per the approved fallback, the built site is delivered as `dist.zip` — serve
`dist/` with any static server (e.g. `npx serve dist`) to click through.

## Route checklist (34/34 built, 0 stubbed)

| Route | Status |
|---|---|
| `/` Home (hero, ticker, entry cards) | Built |
| `/invest/plans` | Built |
| `/invest/stocks` | Built |
| `/invest/stocks/:symbol` | Built |
| `/invest/crypto` | Built |
| `/invest/crypto/:symbol` | Built |
| `/invest/real-estate` | Built |
| `/invest/real-estate/:id` | Built |
| `/invest/portfolio` | Built |
| `/vehicles` | Built |
| `/vehicles/:id` | Built |
| `/membership` | Built |
| `/membership/my` | Built |
| `/membership/vip` | Built |
| `/membership/vip/my` | Built |
| `/membership/giveaways` | Built |
| `/trading/demo` | Built |
| `/trading/live`, `/trading/live/:symbol` | Built |
| `/trading/copy` | Built |
| `/trading/bot` | Built |
| `/trading/managed` | Built |
| `/wallet/deposit` | Built |
| `/wallet/withdraw` | Built |
| `/wallet/transfer` | Built |
| `/wallet/swap` | Built |
| `/wallet/history` | Built |
| `/wallet/connect` (simulated modal) | Built |
| `/account/profile` | Built |
| `/account/verify` (simulated states) | Built |
| `/account/security` | Built |
| `/account/notifications` | Built |
| `/account/support` | Built |
| `*` 404 | Built |

Static audit: every `to=` link target resolves to a defined route — no dead
links. Persistent "Demo environment – simulated funds" bar, footer disclaimer,
and per-screen disclaimer banners on all invest/trading/wallet pages.

## Verification

- `npx tsc -b` — clean
- `npm run build` — succeeds (one chunk-size warning: 761 KB JS, recharts)
- `npx vitest run` — **49/49 pass**: 16 core-logic tests (wallet balances,
  swaps, transfers, portfolio buy/sell math, plan allocation, demo-trading
  orders, copy-trading toggles) + 33 route render smoke tests (every route
  renders without crashing, demo bar present)

## Decisions made

1. **Local build instead of Pages deploy.** Repo creation is blocked by the
   GitHub App permission (403, twice, after install). Built locally and
   packaged `dist.zip` per the approved fallback.
2. **Seeded PRNG market data** (`src/lib/market.ts`) instead of shipping large
   static price files — deterministic per symbol, works offline, keeps charts
   consistent across pages.
3. **Invest buy/sell syncs wallet ↔ portfolio**: buying deducts USD from the
   wallet and adds a holding; selling does the reverse. Deposits, swaps,
   trades, plan starts, and giveaway entries all propagate across pages via
   persisted Zustand stores.
4. **Demo trading uses an isolated $100,000 practice balance** (own store
   slice), separate from the wallet — matches the "practice account" mental
   model and avoids double-counting.
5. **Brand in one constant** (`src/config/brand.ts`): name, tagline,
   accentColor, logoText. Wordmark is text-only; all vehicle models fictional;
   zero Tesla references (verified by search).
6. **Added `resolveJsonModule`** to `tsconfig.app.json` so seed JSON can be
   imported with types.
7. **Defensive browser-API guards** (`matchMedia`, `IntersectionObserver`,
   `scrollTo`) in `Reveal` and `AiBot` after jsdom smoke tests exposed them.

## Known gaps

- `/trading/live/:symbol` renders the LiveMarkets page but does not preselect
  the symbol from the URL (selection is internal state).
- `Support.tsx` inlines FAQ data as a typed constant instead of importing
  `mock/faqs.json` (was written before `resolveJsonModule` was enabled;
  content is identical).
- Security page (password, sessions, 2FA), identity verification, and wallet
  connection are UI-only simulations, as specified — but there is no
  "reset demo data" button in the UI (clearing site data resets).
- Initial JS bundle is 761 KB (recharts); acceptable for a demo, not optimized.
- Single currency (USD), no i18n.

## Three highest-value next steps

1. **Ship it:** create the `meridian-ecosystem-demo` repo manually on GitHub,
   push this folder, add the Pages workflow from `README.md` → live preview URL.
2. **Cut the bundle:** route-level `React.lazy` code-splitting and lazy-load
   recharts only on chart pages.
3. **Real-browser QA pass:** click through every route at 360px and 1440px,
   plus a Lighthouse accessibility/performance audit to catch visual issues
   static tests cannot see.
