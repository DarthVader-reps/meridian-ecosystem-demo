import { describe, expect, it, vi } from 'vitest'
import {
  fetchLiveQuotes,
  parseCoinGeckoResponse,
  parseKrakenResponse,
} from './prices'

const krakenOk = {
  error: [],
  result: {
    XXBTZUSD: { c: ['67234.5', '1.2'], o: '66800.0' },
    XETHZUSD: { c: ['3720.10', '0.5'], o: '3700.00' },
    SOLUSD: { c: ['214.08', '3.1'], o: '218.00' },
  },
}

const geckoOk = {
  bitcoin: { usd: 67234.5, usd_24h_change: 1.8 },
  ethereum: { usd: 3720.1, usd_24h_change: -0.5 },
  solana: { usd: 214.08, usd_24h_change: 2.25 },
}

function mockFetch(json: unknown, ok = true) {
  return vi.fn().mockResolvedValue({ ok, status: ok ? 200 : 500, json: () => Promise.resolve(json) })
}

describe('parseKrakenResponse', () => {
  it('parses last price and derives 24h change from open', () => {
    const q = parseKrakenResponse(krakenOk)
    expect(q?.BTC?.price).toBe(67234.5)
    expect(q?.BTC?.changePct).toBeCloseTo(((67234.5 - 66800) / 66800) * 100, 6)
    expect(q?.ETH?.price).toBe(3720.1)
    expect(q?.SOL?.price).toBe(214.08)
  })

  it('returns null for malformed payloads', () => {
    expect(parseKrakenResponse(null)).toBeNull()
    expect(parseKrakenResponse({})).toBeNull()
    expect(parseKrakenResponse({ result: null })).toBeNull()
    expect(parseKrakenResponse({ result: { XXBTZUSD: { c: ['nope'] } } })).toBeNull()
  })

  it('keeps the symbols it can parse when one pair is bad', () => {
    const q = parseKrakenResponse({ result: { XXBTZUSD: { c: ['1.5'], o: '1.0' }, SOLUSD: {} } })
    expect(q?.BTC?.price).toBe(1.5)
    expect(q?.SOL).toBeUndefined()
  })
})

describe('parseCoinGeckoResponse', () => {
  it('parses usd price and 24h change', () => {
    const q = parseCoinGeckoResponse(geckoOk)
    expect(q?.BTC).toEqual({ price: 67234.5, changePct: 1.8 })
    expect(q?.ETH).toEqual({ price: 3720.1, changePct: -0.5 })
    expect(q?.SOL).toEqual({ price: 214.08, changePct: 2.25 })
  })

  it('returns null for malformed payloads', () => {
    expect(parseCoinGeckoResponse(null)).toBeNull()
    expect(parseCoinGeckoResponse({ bitcoin: { usd: 'high' } })).toBeNull()
    expect(parseCoinGeckoResponse([])).toBeNull()
  })
})

describe('fetchLiveQuotes', () => {
  it('uses Kraken when it succeeds', async () => {
    const f = mockFetch(krakenOk)
    const q = await fetchLiveQuotes(f as unknown as typeof fetch)
    expect(q?.BTC?.price).toBe(67234.5)
    expect(f).toHaveBeenCalledTimes(1)
  })

  it('falls back to CoinGecko when Kraken fails', async () => {
    const krakenFail = mockFetch({}, false)
    const geckoOkFetch = mockFetch(geckoOk)
    const f = vi
      .fn()
      .mockImplementationOnce(krakenFail.getMockImplementation()!)
      .mockImplementationOnce(geckoOkFetch.getMockImplementation()!)
    const q = await fetchLiveQuotes(f as unknown as typeof fetch)
    expect(q?.ETH).toEqual({ price: 3720.1, changePct: -0.5 })
    expect(f).toHaveBeenCalledTimes(2)
  })

  it('returns null when every provider fails', async () => {
    const f = mockFetch({}, false)
    const q = await fetchLiveQuotes(f as unknown as typeof fetch)
    expect(q).toBeNull()
    expect(f).toHaveBeenCalledTimes(2)
  })

  it('returns null when a provider throws', async () => {
    const f = vi.fn().mockRejectedValue(new Error('network down'))
    const q = await fetchLiveQuotes(f as unknown as typeof fetch)
    expect(q).toBeNull()
  })
})
