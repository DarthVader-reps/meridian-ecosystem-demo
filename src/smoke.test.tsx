import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Render the route table at several paths to catch runtime crashes.
const ROUTES = [
  '/',
  '/invest/plans',
  '/invest/stocks',
  '/invest/stocks/MRDN',
  '/invest/crypto',
  '/invest/crypto/BTC',
  '/invest/real-estate',
  '/invest/real-estate/harbor-lofts',
  '/invest/portfolio',
  '/vehicles',
  '/vehicles/aero-one',
  '/membership',
  '/membership/my',
  '/membership/vip',
  '/membership/vip/my',
  '/membership/giveaways',
  '/trading/demo',
  '/trading/live',
  '/trading/copy',
  '/trading/bot',
  '/trading/managed',
  '/wallet/deposit',
  '/wallet/withdraw',
  '/wallet/transfer',
  '/wallet/swap',
  '/wallet/history',
  '/wallet/connect',
  '/account/profile',
  '/account/verify',
  '/account/security',
  '/account/notifications',
  '/account/support',
  '/nope-not-a-route',
]

async function renderAt(path: string) {
  const { default: App } = await import('./App')
  // App uses HashRouter internally; render it and navigate via hash
  window.location.hash = `#${path}`
  const { unmount } = render(<App />)
  // Every page must render the demo bar and some heading
  expect(screen.getByText(/Demo environment – simulated funds/)).toBeTruthy()
  unmount()
  window.location.hash = '#/'
}

describe('route smoke test', () => {
  it.each(ROUTES)('renders %s without crashing', async (path) => {
    await renderAt(path)
  }, 15000)
})

void MemoryRouter
