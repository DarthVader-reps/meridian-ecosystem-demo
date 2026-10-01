import { useMemo } from 'react'
import seedAssets from '../mock/assets.json'
import { usePrices } from '../store/prices'
import type { LiveQuotes } from './prices'

export interface Asset {
  symbol: string
  name: string
  price: number
  changePct: number
  currency: string
  sector: string
  type: string
}

/** Symbols backed by live market data. Everything else is fictional/simulated. */
export const LIVE_SYMBOLS = new Set(['BTC', 'ETH', 'SOL'])

const seed = seedAssets as unknown as Asset[]

/** Pure merge: live quotes override seed prices for mapped symbols only. */
export function applyLivePrices(assets: Asset[], quotes: LiveQuotes): Asset[] {
  if (Object.keys(quotes).length === 0) return assets
  return assets.map((a) => {
    const q = LIVE_SYMBOLS.has(a.symbol) ? quotes[a.symbol as keyof LiveQuotes] : undefined
    return q ? { ...a, price: q.price, changePct: q.changePct } : a
  })
}

/** Asset catalog with live prices patched in once the price poll succeeds. */
export function useAssets(): Asset[] {
  const quotes = usePrices((s) => s.quotes)
  return useMemo(() => applyLivePrices(seed, quotes), [quotes])
}

/** True once live quotes are flowing. */
export function usePricesLive(): boolean {
  return usePrices((s) => s.live)
}
