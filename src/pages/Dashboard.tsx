import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Page } from '../components/layout'
import { Button, Card, Stat, Badge, EmptyState } from '../components/ui'
import { useWallet } from '../store/wallet'
import { usePortfolio } from '../store/portfolio'
import { useMembership } from '../store/membership'
import { formatMoney, formatPct } from '../lib/market'
import assetsJson from '../mock/assets.json'

const priceMap: Record<string, number> = {}
for (const a of assetsJson as Array<{ symbol: string; price: number }>) {
  priceMap[a.symbol] = a.price
}

// Simulated 30-day net-worth history for the chart
function netWorthHistory(current: number) {
  const points: Array<{ day: string; value: number }> = []
  let v = current * 0.92
  for (let i = 29; i >= 0; i--) {
    v = v * (1 + (Math.sin(i * 1.7) * 0.008 + 0.002))
    if (i === 0) v = current
    const d = new Date(Date.now() - i * 86400000)
    points.push({ day: `${d.getMonth() + 1}/${d.getDate()}`, value: Math.round(v) })
  }
  return points
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function Dashboard() {
  const { balances, transactions } = useWallet()
  const { holdings, plans } = usePortfolio()
  const { tier, vip, giveawayEntries } = useMembership()

  const { netWorth, holdingsValue, walletValue, plansValue, holdingsRows } = useMemo(() => {
    const walletValue = Object.entries(balances).reduce((s, [asset, qty]) => {
      const price = asset === 'USD' ? 1 : (priceMap[asset] ?? 0)
      return s + qty * price
    }, 0)
    const rows = holdings.map((h) => {
      const price = priceMap[h.symbol] ?? 0
      const value = h.qty * price
      const pnl = price > 0 ? ((price - h.avgPrice) / h.avgPrice) * 100 : 0
      return { ...h, price, value, pnl }
    })
    const holdingsValue = rows.reduce((s, r) => s + r.value, 0)
    const plansValue = plans.reduce((s, p) => s + p.amount, 0)
    return { netWorth: walletValue + holdingsValue + plansValue, holdingsValue, walletValue, plansValue, holdingsRows: rows }
  }, [balances, holdings, plans])

  const history = useMemo(() => netWorthHistory(netWorth), [netWorth])
  const recentTx = transactions.slice(0, 5)
  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1)

  return (
    <Page title="Dashboard" intro="Your money, at a glance. Live demo balances, holdings, and activity — every transaction updates this page instantly.">
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><Stat label="Net worth" value={formatMoney(netWorth)} sub={<span>Across wallet, holdings & plans</span>} /></Card>
        <Card><Stat label="Wallet" value={formatMoney(walletValue)} sub={<span>{Object.keys(balances).length} currencies</span>} /></Card>
        <Card><Stat label="Holdings" value={formatMoney(holdingsValue)} sub={<span>{holdings.length} positions</span>} /></Card>
        <Card><Stat label="Plans" value={formatMoney(plansValue)} sub={<span>{plans.length} active allocations</span>} /></Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-ink dark:text-paper">Net worth — last 30 days</h3>
            <Badge tone="neutral">Simulated</Badge>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e7e5" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} interval={6} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} width={48} />
                <Tooltip formatter={(v) => [formatMoney(Number(v ?? 0)), 'Net worth']} />
                <Area type="monotone" dataKey="value" stroke="#1b5cff" fill="#1b5cff" fillOpacity={0.15} name="Net worth" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <h3 className="text-base font-semibold text-ink dark:text-paper">Membership</h3>
            <div className="mt-3 flex items-center gap-2">
              <Badge tone={tier === 'elite' ? 'accent' : tier === 'plus' ? 'green' : 'neutral'}>{tierLabel}</Badge>
              {vip !== 'none' && <Badge tone="amber">VIP {vip}</Badge>}
            </div>
            <p className="mt-3 text-sm text-muted">{giveawayEntries.length} giveaway entries</p>
            <Link to="/membership" className="mt-3 inline-block text-sm font-medium text-[var(--color-accent)] hover:underline">
              Manage membership →
            </Link>
          </Card>
          <Card>
            <h3 className="text-base font-semibold text-ink dark:text-paper">Quick actions</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button size="sm" to="/wallet/deposit">Deposit</Button>
              <Button size="sm" variant="secondary" to="/trading/demo">Trade</Button>
              <Button size="sm" variant="secondary" to="/invest/plans">Invest</Button>
              <Button size="sm" variant="secondary" to="/wallet/swap">Swap</Button>
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="!p-0 overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-6">
            <h3 className="text-base font-semibold text-ink dark:text-paper">Top holdings</h3>
            <Link to="/invest/portfolio" className="text-sm font-medium text-[var(--color-accent)] hover:underline">Full portfolio →</Link>
          </div>
          {holdingsRows.length === 0 ? (
            <div className="p-6"><EmptyState title="No holdings" body="Buy your first asset to see it here." /></div>
          ) : (
            <ul className="mt-2 divide-y divide-line dark:divide-[#2a2a2d]">
              {holdingsRows.slice(0, 5).map((h) => (
                <li key={h.symbol} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="font-mono font-semibold text-ink dark:text-paper">{h.symbol}</p>
                    <p className="text-xs text-muted">{h.qty} @ {formatMoney(h.avgPrice)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-medium">{formatMoney(h.value)}</p>
                    <p className={`font-mono text-xs ${h.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatPct(h.pnl)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="!p-0 overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-6">
            <h3 className="text-base font-semibold text-ink dark:text-paper">Recent activity</h3>
            <Link to="/wallet/history" className="text-sm font-medium text-[var(--color-accent)] hover:underline">Full history →</Link>
          </div>
          {recentTx.length === 0 ? (
            <div className="p-6"><EmptyState title="No activity yet" body="Deposits, trades, and swaps will appear here." /></div>
          ) : (
            <ul className="mt-2 divide-y divide-line dark:divide-[#2a2a2d]">
              {recentTx.map((t) => (
                <li key={t.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium capitalize text-ink dark:text-paper">{t.type}</p>
                    <p className="text-xs text-muted">{t.detail ?? t.asset} · {fmtDate(t.date)}</p>
                  </div>
                  <p className={`font-mono text-sm ${t.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {t.amount < 0 ? '' : '+'}{t.amount.toLocaleString()} {t.asset}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <p className="mt-6 text-center text-xs text-muted">
        Demo data only. Balances, trades, and returns are simulated — no real money is involved.
      </p>
    </Page>
  )
}
