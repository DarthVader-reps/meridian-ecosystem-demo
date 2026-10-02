import { describe, it, expect, beforeEach } from 'vitest'
import { useWallet } from '../store/wallet'
import { usePortfolio } from '../store/portfolio'
import { useTrading } from '../store/trading'

beforeEach(() => {
  localStorage.clear()
  useWallet.getState().reset()
  usePortfolio.getState().reset()
  useTrading.getState().reset()
})

describe('wallet balances', () => {
  it('starts at zero with no opening balance', () => {
    const w = useWallet.getState()
    expect(w.balances).toEqual({})
    expect(w.transactions).toEqual([])
  })

  it('deposit increases the balance and records a transaction', () => {
    const w = useWallet.getState()
    const before = w.balances.USD ?? 0
    w.deposit('USD', 500, 'Test deposit')
    const after = useWallet.getState()
    expect(after.balances.USD).toBe(before + 500)
    expect(after.transactions[0].type).toBe('deposit')
    expect(after.transactions[0].amount).toBe(500)
  })

  it('withdraw rejects amounts above the balance', () => {
    const w = useWallet.getState()
    expect(w.balances.USD ?? 0).toBe(0)
    expect(w.withdraw('USD', 1)).toBe(false)
    expect(useWallet.getState().balances.USD ?? 0).toBe(0)
  })

  it('withdraw succeeds within the balance and stores a negative amount', () => {
    const w = useWallet.getState()
    w.deposit('USD', 5000, 'Fund for withdraw test')
    const before = useWallet.getState().balances.USD ?? 0
    expect(useWallet.getState().withdraw('USD', 1000, 'Test')).toBe(true)
    const after = useWallet.getState()
    expect(after.balances.USD).toBe(before - 1000)
    expect(after.transactions[0].amount).toBe(-1000)
  })

  it('withdraw rejects zero and negative amounts', () => {
    const w = useWallet.getState()
    expect(w.withdraw('USD', 0)).toBe(false)
    expect(w.withdraw('USD', -50)).toBe(false)
  })
})

describe('wallet swaps', () => {
  it('swap converts at the given rate', () => {
    const w = useWallet.getState()
    w.deposit('USD', 5000, 'Fund for swap test')
    const funded = useWallet.getState()
    const usdBefore = funded.balances.USD ?? 0
    const btcBefore = funded.balances.BTC ?? 0
    expect(funded.swap('USD', 'BTC', 1000, 0.00002)).toBe(true)
    const after = useWallet.getState()
    expect(after.balances.USD).toBeCloseTo(usdBefore - 1000, 6)
    expect(after.balances.BTC).toBeCloseTo(btcBefore + 0.02, 6)
  })

  it('swap fails when funds are insufficient or assets match', () => {
    const w = useWallet.getState()
    expect(w.swap('USD', 'BTC', 1, 0.00002)).toBe(false)
    expect(w.swap('USD', 'USD', 10, 1)).toBe(false)
    expect(w.swap('USD', 'BTC', 10, 0)).toBe(false)
  })

  it('transfer moves value between assets without a rate', () => {
    const w = useWallet.getState()
    w.deposit('USD', 5000, 'Fund for transfer test')
    const funded = useWallet.getState()
    const usdBefore = funded.balances.USD ?? 0
    expect(funded.transfer('USD', 'EUR', 500)).toBe(true)
    const after = useWallet.getState()
    expect(after.balances.USD).toBe(usdBefore - 500)
    expect(after.balances.EUR).toBe(500)
  })
})

describe('portfolio math', () => {
  it('buy averages the cost basis', () => {
    const p = usePortfolio.getState()
    p.buy('MRDN', 10, 200)
    const holding = usePortfolio.getState().holdings.find((h) => h.symbol === 'MRDN')!
    // (40 * 171.4 + 10 * 200) / 50
    expect(holding.qty).toBe(50)
    expect(holding.avgPrice).toBeCloseTo((40 * 171.4 + 10 * 200) / 50, 6)
  })

  it('buy creates a new holding for an unknown symbol', () => {
    usePortfolio.getState().buy('NEW', 5, 10)
    const holding = usePortfolio.getState().holdings.find((h) => h.symbol === 'NEW')!
    expect(holding).toMatchObject({ symbol: 'NEW', qty: 5, avgPrice: 10 })
  })

  it('sell reduces quantity and rejects oversells', () => {
    const p = usePortfolio.getState()
    expect(p.sell('MRDN', 1000, 180)).toBe(false)
    expect(p.sell('MRDN', 40, 180)).toBe(true)
    expect(usePortfolio.getState().holdings.find((h) => h.symbol === 'MRDN')).toBeUndefined()
  })

  it('portfolio value sums qty * price', () => {
    const holdings = usePortfolio.getState().holdings
    const prices: Record<string, number> = { MRDN: 184.22, NOVAP: 312.9, ETH: 3841.55, SOL: 214.08 }
    const value = holdings.reduce((sum, h) => sum + h.qty * (prices[h.symbol] ?? 0), 0)
    const expected = 40 * 184.22 + 12 * 312.9 + 2 * 3841.55 + 15 * 214.08
    expect(value).toBeCloseTo(expected, 2)
  })

  it('starting a plan records the allocation', () => {
    usePortfolio.getState().startPlan('growth', 5000)
    const plans = usePortfolio.getState().plans
    expect(plans[0]).toMatchObject({ planId: 'growth', amount: 5000 })
  })
})

describe('demo trading', () => {
  it('buy order deducts demo balance and opens a position', () => {
    const t = useTrading.getState()
    const before = t.demoBalance
    expect(t.placeOrder('NOVAP', 'buy', 10, 300)).toBe(true)
    const after = useTrading.getState()
    expect(after.demoBalance).toBe(before - 3000)
    expect(after.positions.find((p) => p.symbol === 'NOVAP')?.qty).toBe(10)
    expect(after.orders[0]).toMatchObject({ symbol: 'NOVAP', side: 'buy', qty: 10 })
  })

  it('buy order fails when the cost exceeds the demo balance', () => {
    const t = useTrading.getState()
    expect(t.placeOrder('NOVAP', 'buy', 100000, 300)).toBe(false)
  })

  it('sell order fails without a position and credits balance on success', () => {
    const t = useTrading.getState()
    expect(t.placeOrder('UNKNOWN', 'sell', 1, 10)).toBe(false)
    const before = useTrading.getState().demoBalance
    expect(t.placeOrder('MRDN', 'sell', 5, 180)).toBe(true)
    expect(useTrading.getState().demoBalance).toBe(before + 900)
  })

  it('copy trading toggles trader ids', () => {
    const t = useTrading.getState()
    t.copyTrader('t1')
    expect(useTrading.getState().copiedTraders).toContain('t1')
    t.stopCopy('t1')
    expect(useTrading.getState().copiedTraders).not.toContain('t1')
  })
})
