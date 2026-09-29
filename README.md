# Meridian — Investment and Trading Ecosystem (Demo)

A complete multi-page front-end prototype of a fictional investment and trading
platform called **Meridian**. Built with Vite + React + TypeScript, React Router
(HashRouter), Tailwind CSS, Zustand, Recharts, and Vitest.

> **Demo disclaimer.** This is a front-end prototype only. All money, balances,
> trades, deposits, withdrawals, identity checks, and wallet connections are
> **simulated** with mock data and local browser state. No real payment,
> exchange, brokerage, blockchain, or KYC integration exists. No return figure
> shown anywhere is real or guaranteed.

## Run locally

Prerequisites: Node.js 18+ and npm.

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build into dist/
npm run preview  # serve the production build locally
npx vitest run   # run the core logic tests
```

## Redeploy (GitHub Pages)

The Vite `base` is set to `/meridian-ecosystem-demo/`, so the built site works
when served from `https://<user>.github.io/meridian-ecosystem-demo/`.

1. Push this folder to a GitHub repository named `meridian-ecosystem-demo`.
2. Add a workflow (`.github/workflows/pages.yml`) that runs `npm ci`,
   `npm run build`, and uploads `dist/` with `actions/upload-pages-artifact`,
   then deploys with `actions/deploy-pages`.
3. In the repository settings, enable Pages with the GitHub Actions source.

Because the app uses `HashRouter`, deep links (e.g.
`#/invest/portfolio`) work on Pages without any server rewrites.

## Folder structure

```
src/
  config/brand.ts        # THE brand constant: name, tagline, accentColor, logoText
  mock/*.json            # seed data: assets, plans, properties, vehicles,
                         # traders, managers, tiers, vip, giveaways, faqs
  lib/market.ts          # seeded price-history generator + formatters
  lib/cn.ts              # classnames helper
  store/                 # Zustand stores (persisted to localStorage)
    wallet.ts            # balances, deposits, withdrawals, transfers, swaps, history
    portfolio.ts         # holdings, plan allocations
    trading.ts           # demo-trading balance/positions/orders, AI bot, copy trading
    membership.ts        # tier, VIP tier, giveaway entries
    account.ts           # profile, verification status, 2FA, notifications, tickets
    ui.ts                # theme, toasts
  components/
    ui.tsx               # design system: Button, Card, forms, Modal, Tabs,
                         # Badge, Toasts, Skeleton, PriceChart, Ticker…
    layout.tsx           # DemoBar, Navbar, Footer, Breadcrumbs, Page, DisclaimerBanner
  pages/                 # one file per route (see route map in REPORT.md)
  App.tsx                # HashRouter + route table
```

## How to rename the brand

Edit the single constant in `src/config/brand.ts`:

```ts
export const BRAND = {
  name: 'Meridian',
  tagline: 'Invest, trade, manage',
  accentColor: '#1b5cff',
  logoText: 'Meridian',
} as const
```

Every visible brand reference (wordmark, nav, footer, page copy) reads from this
constant. The accent color is applied via inline styles and CSS variables, so
changing `accentColor` re-themes the app.

## State and persistence

All demo state lives in Zustand stores under `src/store/`, persisted to
`localStorage` (keys prefixed `meridian-`). A deposit, swap, trade, plan start,
or giveaway entry immediately updates balances, history, and portfolio across
every page. Clearing site data resets the demo to its seed state.

## Accessibility and design notes

- System font stack, near-black/white surfaces, one restrained accent color.
- Light and dark themes (toggle in the nav, persisted).
- Keyboard navigable, labelled inputs, visible focus rings, `prefers-reduced-motion`
  respected, scroll-reveal is subtle and disabled under reduced motion.
- Responsive from 360px to 1440px; mobile drawer navigation.
