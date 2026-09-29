// Deterministic simulated market data. Everything here is mock data for the
// demo — no live prices, no network calls.

function hashSeed(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface PricePoint {
  t: number
  price: number
}

/** Seeded random-walk history ending at basePrice. Deterministic per symbol. */
export function priceHistory(symbol: string, basePrice: number, points = 60): PricePoint[] {
  const rand = mulberry32(hashSeed(symbol))
  const drift = (rand() - 0.45) * 0.02
  const steps: number[] = []
  for (let i = 0; i < points; i++) {
    steps.push((rand() - 0.5 + drift) * 0.03)
  }
  // Walk backwards from the end price so the last point equals basePrice.
  let end = basePrice
  const reversed: number[] = []
  for (let i = points - 1; i >= 0; i--) {
    reversed.unshift(end)
    end = end / (1 + steps[i])
  }
  return reversed.map((price, i) => ({ t: i, price: round2(price) }))}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

/** Slice a history to a range toggle. */
export function rangeSlice(history: PricePoint[], range: '1D' | '1W' | '1M' | '1Y' | 'All'): PricePoint[] {
  const map = { '1D': 24, '1W': 7 * 4, '1M': 30, '1Y': 120, All: history.length } as const
  const n = map[range]
  return history.slice(Math.max(0, history.length - n))
}

export function formatMoney(n: number, digits = 2): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function formatPct(n: number): string {
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}

export function formatQty(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 6 })
}

export function timeAgo(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 60) return `${mins}m ago`
  const h = Math.round(mins / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

let idCounter = 0
export function uid(prefix = 'id'): string {
  idCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`
}
