import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import App from './App'

// Live price polling would hit real exchange APIs from the test runner —
// keep it a no-op here so tests stay hermetic and deterministic.
vi.mock('./store/prices', () => {
  const state = {
    quotes: {},
    live: false,
    updatedAt: null,
    refreshing: false,
    refresh: async () => {},
  }
  const usePrices = (selector?: (s: typeof state) => unknown) =>
    selector ? selector(state) : state
  return {
    usePrices,
    startPricePolling: () => () => {},
  }
})

// Regression test for the reported "blank page on in-app navigation" issue:
// render once, then navigate client-side several times; the shell
// (demo bar, nav) must never disappear.
describe('in-app hash navigation', () => {
  it('keeps rendering the shell across client-side navigations', async () => {
    window.location.hash = '#/'
    const { container, unmount } = render(<App />)
    expect(screen.getByText(/Preview environment · Simulated funds/)).toBeTruthy()

    const destinations = ['#/invest/plans', '#/trading/demo', '#/trading/live', '#/wallet/deposit', '#/membership']
    for (const dest of destinations) {
      await act(async () => {
        window.location.hash = dest
        await new Promise((r) => setTimeout(r, 100))
      })
      const text = container.textContent ?? ''
      expect(text.length).toBeGreaterThan(500)
      expect(text).toContain('Preview environment')
    }
    unmount()
    window.location.hash = '#/'
  }, 30000)

  it('navigates via a real nav Link click without blanking', async () => {
    window.location.hash = '#/'
    const { container, unmount } = render(<App />)
    const plansLink = screen.getAllByRole('link').find((l) => l.textContent === 'Plans')
    expect(plansLink).toBeTruthy()
    await act(async () => {
      fireEvent.click(plansLink!)
      await new Promise((r) => setTimeout(r, 100))
    })
    const text = container.textContent ?? ''
    expect(text.length).toBeGreaterThan(500)
    expect(text).toContain('Preview environment')
    unmount()
    window.location.hash = '#/'
  }, 30000)
})
