/**
 * Live market prices for real crypto assets.
 *
 * Provider chain (no API keys required):
 *   1. Kraken public ticker (global, CORS-enabled)
 *   2. CoinGecko free simple/price (global, CORS-enabled)
 *   3. null — callers fall back to the seeded mock prices
 *
 * Only BTC, ETH and SOL are mapped to live feeds. Every other symbol in the
 * catalog is fictional and stays simulated by design.
 */

export interface LiveQuote {
  price: number
  changePct: number
}

/** Live quotes keyed by app symbol. Missing keys mean that provider had no data. */
export type LiveQuotes = Partial<Record<'BTC' | 'ETH' | 'SOL', LiveQuote>>

const FETCH_TIMEOUT_MS = 8000

const KRAKEN_URL = 'https://api.kraken.com/0/public/Ticker?pair=XBTUSD,ETHUSD,SOLUSD'
const COINGECKO_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true'

async function fetchJson(url: string, fetcher: typeof fetch): Promise<unknown> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetcher(url, { signal: ctrl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as unknown
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Parse Kraken's /0/public/Ticker response.
 * Shape: { error: [], result: { XXBTZUSD: { c: ["<last>"], o: "<today open>" }, ... } }
 * The 24h change is derived from today's open vs last price.
 */
export function parseKrakenResponse(json: unknown): LiveQuotes | null {
  if (!json || typeof json !== 'object') return null
  const result = (json as { result?: unknown }).result
  if (!result || typeof result !== 'object') return null
  const pairs: Record<string, 'BTC' | 'ETH' | 'SOL'> = {
    XXBTZUSD: 'BTC',
    XETHZUSD: 'ETH',
    SOLUSD: 'SOL',
  }
  const out: LiveQuotes = {}
  let found = 0
  for (const [pair, symbol] of Object.entries(pairs)) {
    const entry = (result as Record<string, unknown>)[pair] as
      | { c?: unknown; o?: unknown }
      | undefined
    const last = Number(Array.isArray(entry?.c) ? entry.c[0] : NaN)
    const open = Number(entry?.o)
    if (Number.isFinite(last) && last > 0 && Number.isFinite(open) && open > 0) {
      out[symbol] = { price: last, changePct: ((last - open) / open) * 100 }
      found++
    }
  }
  return found > 0 ? out : null
}

/**
 * Parse CoinGecko's /simple/price response.
 * Shape: { bitcoin: { usd: <n>, usd_24h_change: <n> }, ethereum: {...}, solana: {...} }
 */
export function parseCoinGeckoResponse(json: unknown): LiveQuotes | null {
  if (!json || typeof json !== 'object') return null
  const ids: Record<string, 'BTC' | 'ETH' | 'SOL'> = {
    bitcoin: 'BTC',
    ethereum: 'ETH',
    solana: 'SOL',
  }
  const out: LiveQuotes = {}
  let found = 0
  for (const [id, symbol] of Object.entries(ids)) {
    const entry = (json as Record<string, unknown>)[id] as
      | { usd?: unknown; usd_24h_change?: unknown }
      | undefined
    const price = Number(entry?.usd)
    const change = Number(entry?.usd_24h_change)
    if (Number.isFinite(price) && price > 0) {
      out[symbol] = { price, changePct: Number.isFinite(change) ? change : 0 }
      found++
    }
  }
  return found > 0 ? out : null
}

/**
 * Returns live quotes, or null when every provider fails.
 * The fetcher parameter exists for tests; production passes the global fetch.
 */
export async function fetchLiveQuotes(fetcher: typeof fetch = fetch): Promise<LiveQuotes | null> {
  try {
    const kraken = parseKrakenResponse(await fetchJson(KRAKEN_URL, fetcher))
    if (kraken) return kraken
  } catch {
    /* fall through to CoinGecko */
  }
  try {
    const gecko = parseCoinGeckoResponse(await fetchJson(COINGECKO_URL, fetcher))
    if (gecko) return gecko
  } catch {
    /* fall through to null */
  }
  return null
}
