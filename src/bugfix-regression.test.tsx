import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { Tabs } from './components/ui'
import { useRequireLogin } from './components/useRequireLogin'
import { useTrading } from './store/trading'
import { useAuth } from './store/auth'
import DemoTrading from './pages/trading/DemoTrading'
import App from './App'

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
