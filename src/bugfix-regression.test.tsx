import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { Modal, Tabs } from './components/ui'
import { useRequireLogin } from './components/useRequireLogin'
import { useTrading } from './store/trading'
import { useAuth } from './store/auth'
import { useWallet } from './store/wallet'
import DemoTrading from './pages/trading/DemoTrading'
import PlansPage from './pages/invest/Plans'
import AdminTransactions from './pages/admin/Transactions'
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

beforeEach(() => {
  localStorage.clear()
  useTrading.getState().reset()
  useAuth.setState({ user: null, initialized: true } as never)
})

describe('sell-tab order regression (issue: clicking Sell tab placed an order)', () => {
  it('Tabs renders type="button" so tabs never submit a surrounding form', () => {
    render(
      <MemoryRouter>
        <Tabs tabs={[{ id: 'buy', label: 'Buy' }, { id: 'sell', label: 'Sell' }]} value="buy" onChange={() => {}} />
      </MemoryRouter>,
    )
    for (const tab of screen.getAllByRole('tab')) {
      expect(tab.getAttribute('type')).toBe('button')
    }
  })

  it('clicking the Sell tab on the demo order ticket does not place an order', async () => {
    render(
      <MemoryRouter>
        <DemoTrading />
      </MemoryRouter>,
    )
    const before = useTrading.getState()
    expect(before.orders.length).toBe(2) // seed orders
    expect(before.positions.find((p) => p.symbol === 'MRDN')?.qty).toBe(10)

    const sellTab = screen.getByRole('tab', { name: 'Sell' })
    await act(async () => {
      fireEvent.click(sellTab)
    })

    const after = useTrading.getState()
    expect(after.orders.length).toBe(2)
    expect(after.positions.find((p) => p.symbol === 'MRDN')?.qty).toBe(10)
    // The tab did switch (selection still works), it just must not submit.
    expect(sellTab.getAttribute('aria-selected')).toBe('true')
  })
})

describe('hub routes redirect instead of 404', () => {
  it.each(['/invest', '/trading', '/wallet', '/account'])('renders %s without the 404 page', async (path) => {
    window.location.hash = `#${path}`
    const { container, unmount } = render(<App />)
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })
    const text = container.textContent ?? ''
    expect(text).not.toContain('Page not found')
    expect(text).toContain('Demo environment')
    unmount()
    window.location.hash = '#/'
  }, 15000)
})

function GuardProbe() {
  const guard = useRequireLogin()
  return (
    <button
      onClick={() => {
        ;(window as unknown as { __guardResult?: boolean }).__guardResult = guard()
      }}
    >
      protected action
    </button>
  )
}

function guardResult() {
  return (window as unknown as { __guardResult?: boolean }).__guardResult
}

describe('useRequireLogin', () => {
  function renderProbe() {
    delete (window as unknown as { __guardResult?: boolean }).__guardResult
    return render(
      <MemoryRouter initialEntries={['/membership']}>
        <Routes>
          <Route path="/membership" element={<GuardProbe />} />
          <Route path="/login" element={<div>LOGIN PAGE</div>} />
        </Routes>
      </MemoryRouter>,
    )
  }

  it('redirects logged-out users to /login and returns false', async () => {
    useAuth.setState({ user: null, initialized: true } as never)
    renderProbe()
    await act(async () => {
      fireEvent.click(screen.getByText('protected action'))
    })
    expect(guardResult()).toBe(false)
    expect(screen.getByText('LOGIN PAGE')).toBeTruthy()
  })

  it('lets logged-in users through and returns true', async () => {
    useAuth.setState({ user: { id: 'u1', email: 't@e.com', name: 'T' }, initialized: true } as never)
    renderProbe()
    await act(async () => {
      fireEvent.click(screen.getByText('protected action'))
    })
    expect(guardResult()).toBe(true)
    expect(screen.queryByText('LOGIN PAGE')).toBeNull()
  })
})

describe('modal focus retention (issue: typing "50" into plan amount ended as "5")', () => {
  // Mimics PlansPage: the parent recreates `close` on every render, so the
  // Modal receives a fresh onClose identity after each keystroke.
  function Harness() {
    const [amount, setAmount] = useState('')
    const close = () => {}
    return (
      <Modal open onClose={close} title="Test dialog">
        <input aria-label="amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </Modal>
    )
  }

  it('focuses the input (not the close button) when the dialog opens', () => {
    render(<Harness />)
    expect(document.activeElement).toBe(screen.getByLabelText('amount'))
  })

  it('keeps focus in the input across keystrokes so "50" stays "50"', () => {
    render(<Harness />)
    const input = screen.getByLabelText('amount') as HTMLInputElement
    input.focus()
    fireEvent.change(input, { target: { value: '5' } })
    expect(document.activeElement).toBe(input)
    expect(input.value).toBe('5')
    fireEvent.change(input, { target: { value: '50' } })
    expect(document.activeElement).toBe(input)
    expect(input.value).toBe('50')
  })

  it('Escape still closes the dialog', () => {
    let closed = 0
    render(
      <Modal open onClose={() => { closed += 1 }} title="Test dialog">
        <input aria-label="amount" />
      </Modal>,
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(closed).toBe(1)
  })
})

describe('plan amount typing end-to-end (issue: "50" became "5")', () => {
  it('typing 50 char-by-char into the Start-plan amount keeps the full value', async () => {
    useAuth.setState({ user: { id: 'u1', email: 't@e.com', name: 'T' }, initialized: true } as never)
    render(
      <MemoryRouter>
        <PlansPage />
      </MemoryRouter>,
    )
    const startButtons = await screen.findAllByText('Start plan')
    await act(async () => {
      fireEvent.click(startButtons[0])
    })
    const amountInput = screen.getByLabelText('Amount (USD)') as HTMLInputElement
    await act(async () => {
      fireEvent.change(amountInput, { target: { value: '5' } })
    })
    await act(async () => {
      fireEvent.change(amountInput, { target: { value: '50' } })
    })
    expect(amountInput.value).toBe('50')
    expect(document.activeElement).toBe(amountInput)
  })
})

describe('limit price display (issue: float dust like 184.22000122070312)', () => {
  it('initializes the limit price input with a clean rounded value', () => {
    render(
      <MemoryRouter>
        <DemoTrading />
      </MemoryRouter>,
    )
    expect((screen.getByLabelText('Limit price') as HTMLInputElement).value).toBe('184.22')
  })

  it('switching assets keeps the limit price clean', () => {
    render(
      <MemoryRouter>
        <DemoTrading />
      </MemoryRouter>,
    )
    fireEvent.change(screen.getByLabelText('Asset'), { target: { value: 'BTC' } })
    expect((screen.getByLabelText('Limit price') as HTMLInputElement).value).toBe('97412')
  })
})

describe('admin settings float artifacts (issue: trading fee showed 0.10000000149011612)', () => {
  it('updateSettings normalizes money fields to 2 decimals', async () => {
    const { useAdmin } = await import('./store/admin')
    useAdmin.getState().updateSettings({ tradingFeePct: 0.10000000149011612 })
    expect(useAdmin.getState().settings.tradingFeePct).toBe(0.1)
  })

  it('persist rehydration cleans legacy float artifacts from storage', async () => {
    // Simulate a real browser profile whose localStorage still holds a
    // pre-fix artifact, then load the store module fresh so zustand's
    // persist merge runs exactly as it does on page load.
    vi.resetModules()
    localStorage.setItem(
      'meridian-admin',
      JSON.stringify({
        state: {
          settings: {
            platformName: 'Meridian',
            maintenanceMode: false,
            demoBalance: 100000,
            tradingFeePct: 0.10000000149011612,
            withdrawalFeeUSD: 5,
            minDepositUSD: 10,
            allowSignups: true,
          },
        },
        version: 0,
      }),
    )
    const { useAdmin } = await import('./store/admin')
    expect(useAdmin.getState().settings.tradingFeePct).toBe(0.1)
  })
})

describe('admin transactions ledger (issue: admin credit/debit reasons were invisible)', () => {
  it('renders the detail column and makes it searchable', () => {
    const w = useWallet.getState()
    w.reset()
    w.deposit('USD', 10, 'Admin credit: QA verification credit')
    render(
      <MemoryRouter>
        <AdminTransactions />
      </MemoryRouter>,
    )
    // The Detail column header and the reason text are visible.
    expect(screen.getByText('Detail')).toBeTruthy()
    expect(screen.getByText('Admin credit: QA verification credit')).toBeTruthy()
    // Searching the reason narrows to the matching row…
    fireEvent.change(screen.getByLabelText('Search transactions'), { target: { value: 'QA verification' } })
    expect(screen.getByText('Admin credit: QA verification credit')).toBeTruthy()
    // …and a non-matching query hides it.
    fireEvent.change(screen.getByLabelText('Search transactions'), { target: { value: 'no-such-detail-xyz' } })
    expect(screen.queryByText('Admin credit: QA verification credit')).toBeNull()
    w.reset()
  })
})
