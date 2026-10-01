import { useMemo, useState } from 'react'
import { Badge, Card, PriceChart, Stat, Tabs } from '../../components/ui'
import { Page } from '../../components/layout'
import { formatMoney, formatPct, priceHistory, rangeSlice } from '../../lib/market'
import { cn } from '../../lib/cn'
import { LIVE_SYMBOLS, useAssets, usePricesLive } from '../../lib/assetPrices'

type Range = '1D' | '1W' | '1M' | '1Y' | 'All'

/** Deterministic pseudo-random from a string seed. */
function seededRand(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return (h % 100000) / 100000
}

interface BookLevel {
  price: number
  size: number
}

function buildBook(symbol: string, price: number): { bids: BookLevel[]; asks: BookLevel[] } {
  const bids: BookLevel[] = []
  const asks: BookLevel[] = []
  const tick = Math.max(price * 0.0005, 0.01)
  for (let i = 0; i < 8; i++) {
    bids.push({
      price: Math.round((price - tick * (i + 1)) * 100) / 100,
      size: 1 + Math.round(seededRand(`${symbol}-bid-${i}`) * 48),
    })
    asks.push({
      price: Math.round((price + tick * (i + 1)) * 100) / 100,
      size: 1 + Math.round(seededRand(`${symbol}-ask-${i}`) * 48),
    })
  }
  return { bids, asks }
}

export default function LiveMarkets() {
  const assets = useAssets()
  const pricesLive = usePricesLive()
  const [selectedSymbol, setSelectedSymbol] = useState(assets[0].symbol)
  const [range, setRange] = useState<Range>('1W')

  const selected = assets.find((a) => a.symbol === selectedSymbol) ?? assets[0]

  const history = useMemo(() => priceHistory(selected.symbol, selected.price, 140), [selected.symbol, selected.price])
  const sliced = useMemo(() => rangeSlice(history, range), [history, range])
  const book = useMemo(() => buildBook(selected.symbol, selected.price), [selected.symbol, selected.price])
  const maxSize = Math.max(...book.bids.map((b) => b.size), ...book.asks.map((b) => b.size))

  const up = selected.changePct >= 0
  const dayHigh = Math.max(...history.map((p) => p.price))
  const dayLow = Math.min(...history.map((p) => p.price))

  return (
    <Page title="Live markets" intro="BTC, ETH and SOL stream live market prices; the order book and all other quotes are illustrative. Nothing here moves real money." disclaimer>
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="p-4 lg:p-4">
          <h2 className="px-2 pt-1 text-sm font-semibold uppercase tracking-wide text-muted">Watchlist</h2>
          <ul className="mt-2 divide-y divide-line dark:divide-[#2a2a2d]">
            {assets.map((a) => {
              const active = a.symbol === selectedSymbol
              return (
                <li key={a.symbol}>
                  <button
                    onClick={() => setSelectedSymbol(a.symbol)}
                    aria-pressed={active}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left cursor-pointer transition-colors',
                      active ? 'bg-accent-soft dark:bg-[#1b2a5c]' : 'hover:bg-mist dark:hover:bg-ink',
                    )}
                  >
                    <span>
                      <span className="block text-sm font-semibold text-ink dark:text-paper">{a.symbol}</span>
                      <span className="block text-xs text-muted">{a.name}</span>
                    </span>
                    <span className="text-right">
                      <span className="block text-sm font-medium text-ink dark:text-paper">{formatMoney(a.price)}</span>
                      <span
                        className={cn(
                          'block text-xs',
                          a.changePct >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
                        )}
                      >
                        {formatPct(a.changePct)}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-ink dark:text-paper">{selected.name}</h2>
                  <Badge tone="neutral">{selected.type === 'crypto' ? 'Crypto' : 'Stock'}</Badge>
                  {pricesLive && LIVE_SYMBOLS.has(selected.symbol) && <Badge tone="green">Live price</Badge>}
                </div>
                <p className="mt-1 text-sm text-muted">
                  {selected.symbol} · {selected.sector}
                </p>
              </div>
              <Tabs
                tabs={(['1D', '1W', '1M', '1Y', 'All'] as Range[]).map((r) => ({ id: r, label: r }))}
                value={range}
                onChange={setRange}
              />
            </div>
            <div className="mt-4">
              <PriceChart data={sliced} height={240} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Price" value={formatMoney(selected.price)} />
              <Stat
                label="Change"
                value={formatPct(selected.changePct)}
                sub={
                  <span className={up ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {pricesLive && LIVE_SYMBOLS.has(selected.symbol) ? 'Live 24h move' : 'Simulated 24h move'}
                  </span>
                }
              />
              <Stat label="Simulated day high" value={formatMoney(dayHigh)} />
              <Stat label="Simulated day low" value={formatMoney(dayLow)} />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink dark:text-paper">Order book</h2>
              <Badge tone="amber">Simulated order book</Badge>
            </div>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-green-600 dark:text-green-400">Bids</p>
                <ul className="mt-2 space-y-1">
                  {book.bids.map((b) => (
                    <li key={b.price} className="relative overflow-hidden rounded-md">
                      <div
                        aria-hidden="true"
                        className="absolute inset-y-0 left-0 bg-green-100 dark:bg-green-950"
                        style={{ width: `${(b.size / maxSize) * 100}%` }}
                      />
                      <div className="relative flex justify-between px-2 py-1 text-sm">
                        <span className="text-ink dark:text-paper">{formatMoney(b.price)}</span>
                        <span className="text-muted">{b.size}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">Asks</p>
                <ul className="mt-2 space-y-1">
                  {book.asks.map((b) => (
                    <li key={b.price} className="relative overflow-hidden rounded-md">
                      <div
                        aria-hidden="true"
                        className="absolute inset-y-0 left-0 bg-red-100 dark:bg-red-950"
                        style={{ width: `${(b.size / maxSize) * 100}%` }}
                      />
                      <div className="relative flex justify-between px-2 py-1 text-sm">
                        <span className="text-ink dark:text-paper">{formatMoney(b.price)}</span>
                        <span className="text-muted">{b.size}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted">
              Levels and sizes are illustrative placeholders generated locally. They do not represent real liquidity.
            </p>
          </Card>
        </div>
      </div>
    </Page>
  )
}
