import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import Deposit from './Deposit'
import Withdraw from './Withdraw'
import { useWallet } from '../../store/wallet'
import { useAssets } from '../../lib/assetPrices'

function assetOptions(page: 'deposit' | 'withdraw'): string[] {
  const { unmount } = render(
    <MemoryRouter>
      {page === 'deposit' ? <Deposit /> : <Withdraw />}
    </MemoryRouter>,
  )
  const select = screen.getByLabelText('Asset') as HTMLSelectElement
  const options = within(select).getAllByRole('option').map((o) => o.textContent ?? '')
  unmount()
  return options
}

describe('crypto-only deposit/withdraw rails', () => {
  beforeEach(() => {
    useWallet.getState().reset()
  })

  it('offers only BTC, ETH, USDT on the deposit route (no fiat)', () => {
    expect(assetOptions('deposit')).toEqual(['BTC', 'ETH', 'USDT'])
  })

  it('offers only BTC, ETH, USDT on the withdraw route (no fiat)', () => {
    expect(assetOptions('withdraw')).toEqual(['BTC', 'ETH', 'USDT'])
  })

  it('lists USDT in the asset catalog as a $1.00 stablecoin', () => {
    function Probe() {
      const assets = useAssets()
      const usdt = assets.find((a) => a.symbol === 'USDT')
      return <span data-testid="usdt">{usdt ? `${usdt.price}:${usdt.type}` : 'missing'}</span>
    }
    render(
      <MemoryRouter>
        <Probe />
      </MemoryRouter>,
    )
    expect(screen.getByTestId('usdt').textContent).toBe('1:crypto')
  })

  it('shows per-network options when USDT is selected for deposit', () => {
    render(
      <MemoryRouter>
        <Deposit />
      </MemoryRouter>,
    )
    fireEvent.change(screen.getByLabelText('Asset'), { target: { value: 'USDT' } })
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '100' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    const network = screen.getByLabelText('Network') as HTMLSelectElement
    const options = within(network).getAllByRole('option').map((o) => o.textContent ?? '')
    expect(options).toEqual(['Ethereum · ERC-20 (simulated)', 'Tron · TRC-20 (simulated)'])
    expect(screen.getByText('Sample address — do not send real funds.')).toBeTruthy()
  })

  it('requires a destination address before a withdrawal can continue', () => {
    const w = useWallet.getState()
    w.reset()
    w.deposit('BTC', 1, 'test seed')
    render(
      <MemoryRouter>
        <Withdraw />
      </MemoryRouter>,
    )
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '0.5' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    // Destination step: try to continue with an empty address
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByText('Enter a valid destination address.')).toBeTruthy()
    w.reset()
  })
})
