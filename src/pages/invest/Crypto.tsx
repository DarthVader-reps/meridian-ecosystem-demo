import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Page } from '../../components/layout'
import { Card, EmptyState, Input, LoadingState } from '../../components/ui'
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

export default function CryptoPage() {
  const [ready, setReady] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 500)
    return () => clearTimeout(t)
  }, [])

  const coins = useMemo(() => assets.filter((a) => a.type === 'crypto'), [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return coins.filter(
      (c) => q === '' || c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q),
    )
  }, [coins, query])

  const changeClass = (pct: number) =>
    pct >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'

  return (
    <Page title="Crypto" intro="Browse simulated crypto assets and open a detail view to trade." disclaimer>
      {!ready ? (
        <LoadingState label="Loading crypto" />
      ) : (
        <div className="space-y-6">
          <div className="max-w-md">
            <Input
              type="search"
              aria-label="Search crypto"
              placeholder="Search by name or symbol"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {results.length === 0 ? (
            <EmptyState
              title="No assets found"
              body="No simulated crypto matches your search. Try a different name or symbol."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((c) => (
                <Link key={c.symbol} to={`/invest/crypto/${c.symbol}`} aria-label={`View ${c.name}`}>
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <div>
                      <p className="text-sm font-semibold text-ink dark:text-paper">{c.symbol}</p>
                      <h2 className="mt-0.5 text-base font-medium text-muted">{c.name}</h2>
                    </div>
                    <div className="mt-4 flex items-baseline justify-between">
                      <p className="text-xl font-semibold text-ink dark:text-paper">{formatMoney(c.price)}</p>
                      <p className={`text-sm font-medium ${changeClass(c.changePct)}`}>{formatPct(c.changePct)}</p>
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
