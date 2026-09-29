import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Page } from '../../components/layout'
import { Button, Card, EmptyState, LoadingState, PriceChart, Stat, Tabs } from '../../components/ui'
import { usePortfolio } from '../../store/portfolio'
import { formatMoney, formatPct, formatQty, priceHistory, rangeSlice, timeAgo } from '../../lib/market'
import type { PricePoint } from '../../lib/market'
import assetsJson from '../../mock/assets.json'
import plansJson from '../../mock/plans.json'

interface Asset {
  symbol: string
  name: string
  type: 'stock' | 'crypto'
  price: number
  changePct: number
  currency: string
  sector: string
}

interface Plan {
  id: string
  name: string
}

const assets = assetsJson as unknown as Asset[]
const plans = plansJson as unknown as Plan[]

type RangeKey = '1D' | '1W' | '1M' | '1Y' | 'All'

const RANGES: { id: RangeKey; label: string }[] = [
  { id: '1D', label: '1D' },
  { id: '1W', label: '1W' },
  { id: '1M', label: '1M' },
  { id: '1Y', label: '1Y' },
  { id: 'All', label: 'All' },
]

const POINTS = 150

export default function PortfolioPage() {
  const [ready, setReady] = useState(false)
  const [range, setRange] = useState<RangeKey>('1M')
  const holdings = usePortfolio((s) => s.holdings)
  const planAllocations = usePortfolio((s) => s.plans)

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 500)
    return () => clearTimeout(t)
  }, [])

  const priceMap = useMemo(() => {
    const map: Record<string, number> = {}
    for (const a of assets) map[a.symbol] = a.price
    return map
  }, [])

  const rows = useMemo(
    () =>
      holdings
        .map((h) => {
          const current = priceMap[h.symbol]
          const value = current != null ? h.qty * current : 0
          const cost = h.qty * h.avgPrice
          return { ...h, current, value, cost, pnl: value - cost, pnlPct: cost > 0 ? ((value - cost) / cost) * 100 : 0 }
        })
        .filter((r) => r.current != null),
    [holdings, priceMap],
  )

  const totalValue = useMemo(() => rows.reduce((sum, r) => sum + r.value, 0), [rows])

  const aggregate: PricePoint[] = useMemo(() => {
    const acc = Array.from({ length: POINTS }, (_, i) => ({ t: i, price: 0 }))
    for (const h of holdings) {
      const p = priceMap[h.symbol]
      if (p == null) continue
      const hist = priceHistory(h.symbol, p, POINTS)
      for (let i = 0; i < POINTS; i += 1) {
        acc[i].price = Math.round((acc[i].price + hist[i].price * h.qty) * 100) / 100
      }
    }
    return acc
  }, [holdings, priceMap])

  const chartData = useMemo(() => rangeSlice(aggregate, range), [aggregate, range])

  const allocation = useMemo(
    () =>
      rows
        .map((r) => ({ ...r, pct: totalValue > 0 ? (r.value / totalValue) * 100 : 0 }))
        .sort((a, b) => b.value - a.value),
    [rows, totalValue],
  )

  const planName = (id: string) => plans.find((p) => p.id === id)?.name ?? id
  const detailPath = (symbol: string) => {
    const asset = assets.find((a) => a.symbol === symbol)
    return asset?.type === 'crypto' ? `/invest/crypto/${symbol}` : `/invest/stocks/${symbol}`
  }

  return (
    <Page
      title="Portfolio"
      intro="Your simulated holdings and plans in one view. All figures are simulated."
      disclaimer
    >
      {!ready ? (
        <LoadingState label="Loading portfolio" />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No holdings yet"
          body="Your portfolio is empty. Browse simulated stocks or crypto to make your first trade."
          action={
            <Button to="/invest/stocks">Browse stocks</Button>
          }
        />
      ) : (
        <div className="space-y-8">
          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <Stat label="Total value" value={formatMoney(totalValue)} />
              <div className="mt-4">
                <PriceChart data={chartData} height={240} />
              </div>
              <div className="mt-4">
                <Tabs tabs={RANGES} value={range} onChange={setRange} />
              </div>
            </Card>
            <Card>
              <p className="text-sm font-semibold text-ink dark:text-paper">Allocation</p>
              <ul className="mt-4 space-y-3">
                {allocation.map((a) => (
                  <li key={a.symbol}>
                    <div className="flex items-center justify-between text-sm">
                      <Link to={detailPath(a.symbol)} className="font-medium text-ink dark:text-paper hover:underline">
                        {a.symbol}
                      </Link>
                      <span className="text-muted">
                        {a.pct.toFixed(1)}% &middot; {formatMoney(a.value, 0)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-mist dark:bg-[#2a2a2d]">
                      <div className="h-2 rounded-full bg-[var(--color-accent)]" style={{ width: `${Math.min(100, a.pct)}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card>
            <p className="text-sm font-semibold text-ink dark:text-paper">Holdings</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line dark:border-[#2a2a2d] text-muted">
                    <th className="py-2 pr-4 font-medium">Symbol</th>
                    <th className="py-2 pr-4 font-medium">Qty</th>
                    <th className="py-2 pr-4 font-medium">Avg price</th>
                    <th className="py-2 pr-4 font-medium">Current</th>
                    <th className="py-2 pr-4 font-medium">Value</th>
                    <th className="py-2 font-medium">P/L</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.symbol} className="border-b border-line dark:border-[#2a2a2d] last:border-0">
                      <td className="py-2.5 pr-4">
                        <Link to={detailPath(r.symbol)} className="font-semibold text-ink dark:text-paper hover:underline">
                          {r.symbol}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-4 text-muted">{formatQty(r.qty)}</td>
                      <td className="py-2.5 pr-4 text-muted">{formatMoney(r.avgPrice)}</td>
                      <td className="py-2.5 pr-4 text-muted">{formatMoney(r.current ?? 0)}</td>
                      <td className="py-2.5 pr-4 font-medium text-ink dark:text-paper">{formatMoney(r.value)}</td>
                      <td
                        className={`py-2.5 font-medium ${
                          r.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {formatPct(r.pnlPct)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink dark:text-paper">Plans</p>
              <Button to="/invest/plans" variant="secondary" size="sm">
                View plans
              </Button>
            </div>
            {planAllocations.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No plans started yet.</p>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {planAllocations.map((p, i) => (
                  <li
                    key={`${p.planId}-${i}`}
                    className="flex items-center justify-between rounded-xl border border-line dark:border-[#2a2a2d] px-4 py-3 text-sm"
                  >
                    <span className="font-medium text-ink dark:text-paper">{planName(p.planId)}</span>
                    <span className="text-muted">
                      {formatMoney(p.amount, 0)} &middot; {timeAgo(p.date)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </Page>
  )
}
