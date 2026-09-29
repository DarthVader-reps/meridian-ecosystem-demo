import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Page } from '../../components/layout'
import { Badge, Card, EmptyState, Input, LoadingState, Select } from '../../components/ui'
import { formatMoney, formatPct } from '../../lib/market'
import assetsJson from '../../mock/assets.json'

interface Asset {
  symbol: string
  name: string
  type: 'stock' | 'crypto'
  price: number
  changePct: number
  currency: string
  sector: string
}

const assets = assetsJson as unknown as Asset[]

export default function StocksPage() {
  const [ready, setReady] = useState(false)
  const [query, setQuery] = useState('')
  const [sector, setSector] = useState('all')

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 500)
    return () => clearTimeout(t)
  }, [])

  const stocks = useMemo(() => assets.filter((a) => a.type === 'stock'), [])
  const sectors = useMemo(() => Array.from(new Set(stocks.map((s) => s.sector))).sort(), [stocks])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return stocks.filter((s) => {
      const matchesQuery = q === '' || s.name.toLowerCase().includes(q) || s.symbol.toLowerCase().includes(q)
      const matchesSector = sector === 'all' || s.sector === sector
      return matchesQuery && matchesSector
    })
  }, [stocks, query, sector])

  const changeClass = (pct: number) =>
    pct >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'

  return (
    <Page title="Stocks" intro="Browse simulated stock listings and open a detail view to trade." disclaimer>
      {!ready ? (
        <LoadingState label="Loading stocks" />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <Input
                type="search"
                aria-label="Search stocks"
                placeholder="Search by name or symbol"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="sm:w-56">
              <Select aria-label="Filter by sector" value={sector} onChange={(e) => setSector(e.target.value)}>
                <option value="all">All sectors</option>
                {sectors.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {results.length === 0 ? (
            <EmptyState
              title="No stocks found"
              body="No simulated stocks match your search. Try a different name, symbol, or sector."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((s) => (
                <Link key={s.symbol} to={`/invest/stocks/${s.symbol}`} aria-label={`View ${s.name}`}>
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-ink dark:text-paper">{s.symbol}</p>
                        <h2 className="mt-0.5 text-base font-medium text-muted">{s.name}</h2>
                      </div>
                      <Badge tone="neutral">{s.sector}</Badge>
                    </div>
                    <div className="mt-4 flex items-baseline justify-between">
                      <p className="text-xl font-semibold text-ink dark:text-paper">{formatMoney(s.price)}</p>
                      <p className={`text-sm font-medium ${changeClass(s.changePct)}`}>{formatPct(s.changePct)}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </Page>
  )
}
