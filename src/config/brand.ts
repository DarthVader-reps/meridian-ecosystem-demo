/// <reference types="vitest/config" />
// Single source of truth for the placeholder brand.
// Rename the product by editing these four values only.
export const BRAND = {
  name: 'Meridian',
  tagline: 'Invest, trade, manage',
  accentColor: '#1b5cff',
  logoText: 'Meridian',
} as const

export const DEMO_DISCLAIMER =
  'Demo only. All balances, trades, deposits, withdrawals, and returns shown here are simulated with mock data. Nothing on this page involves real money, and no return figure is real or guaranteed.'
