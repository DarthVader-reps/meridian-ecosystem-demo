import { describe, expect, it } from 'vitest'
import { applyLivePrices, LIVE_SYMBOLS, type Asset } from './assetPrices'

const seed: Asset[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 60000, changePct: 1, currency: 'USD', sector: 'Crypto', type: 'crypto' },
  { symbol: 'MRDN', name: 'Meridian Composite', price: 184.22, changePct: 1.8, currency: 'USD', sector: 'Technology', type: 'stock' },
]

describe('applyLivePrices', () => {
  it('returns the seed array untouched when there are no quotes', () => {
    expect(applyLivePrices(seed, {})).toBe(seed)
  })

  it('overrides only live-mapped symbols', () => {
    const out = applyLivePrices(seed, { BTC: { price: 67234.5, changePct: -1.2 } })
    expect(out.find((a) => a.symbol === 'BTC')).toMatchObject({ price: 67234.5, changePct: -1.2 })
    // Fictional assets are never touched, even if a quote key matched.
    expect(out.find((a) => a.symbol === 'MRDN')).toMatchObject({ price: 184.22, changePct: 1.8 })
  })

  it('does not mutate the seed array', () => {
    applyLivePrices(seed, { BTC: { price: 1, changePct: 0 } })
    expect(seed[0].price).toBe(60000)
  })

  it('documents the live symbol set', () => {
    expect([...LIVE_SYMBOLS].sort()).toEqual(['BTC', 'ETH', 'SOL'])
  })
})
