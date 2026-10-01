import { useEffect, useMemo, useState } from 'react'
import { useWallet } from '../../store/wallet'
import { useAdmin } from '../../store/admin'
import { Card, SectionHeader, Badge, Input, Select, EmptyState, Button } from '../../components/ui'
import DataSourceBadge from '../../components/DataSourceBadge'
import { isSupabaseConfigured } from '../../config/supabase'
import {
  getAdminAccess,
  fetchAllTransactions,
  type AdminAccess,
  type SupabaseTransaction,
} from '../../lib/supabaseAdmin'

interface PlatformTx {
  id: string
  user: string
  type: string
  asset: string
  amount: number
  date: string
}

const SEED_PLATFORM_TXS: PlatformTx[] = [
  { id: 'ptx-1', user: 'Ava Chen', type: 'deposit', asset: 'USD', amount: 15000, date: new Date(Date.now() - 3600000 * 2).toISOString() },
  { id: 'ptx-2', user: 'Liam Ortiz', type: 'trade', asset: 'BTC', amount: 0.12, date: new Date(Date.now() - 3600000 * 5).toISOString() },
  { id: 'ptx-3', user: 'James Park', type: 'withdraw', asset: 'USD', amount: 4200, date: new Date(Date.now() - 3600000 * 9).toISOString() },
  { id: 'ptx-4', user: 'Emma Wilson', type: 'swap', asset: 'ETH', amount: 1.5, date: new Date(Date.now() - 3600000 * 14).toISOString() },
  { id: 'ptx-5', user: 'Sofia Marino', type: 'deposit', asset: 'USD', amount: 2500, date: new Date(Date.now() - 3600000 * 22).toISOString() },
  { id: 'ptx-6', user: 'Ethan Brown', type: 'trade', asset: 'MRDN', amount: 50, date: new Date(Date.now() - 3600000 * 30).toISOString() },
]

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function toneFor(type: string): 'green' | 'red' | 'accent' | 'neutral' {
  switch (type) {
    case 'deposit': return 'green'
    case 'withdraw': return 'red'
    case 'trade': return 'accent'
    default: return 'neutral'
  }
}

function TxTable({ rows }: { rows: PlatformTx[] }) {
  if (rows.length === 0) {
    return <div className="p-8"><EmptyState title="No transactions" body="Try a different search or filter." /></div>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-wider text-muted dark:border-[#2a2a2d]">
            <th className="px-4 py-3 font-medium">User</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Asset</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id} className="border-b border-line last:border-0 dark:border-[#2a2a2d]">
              <td className="px-4 py-3 font-medium text-ink dark:text-paper">{t.user}</td>
              <td className="px-4 py-3"><Badge tone={toneFor(t.type)}>{t.type}</Badge></td>
              <td className="px-4 py-3 font-mono">{t.asset}</td>
              <td className={`px-4 py-3 font-mono ${t.amount < 0 ? 'text-red-600' : 'text-ink dark:text-paper'}`}>
                {t.amount < 0 ? '' : '+'}{t.amount.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-muted">{fmtDate(t.date)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Transactions() {
  const { transactions: ownTx } = useWallet()
  const { users } = useAdmin()
  const [typeFilter, setTypeFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [access, setAccess] = useState<AdminAccess>(isSupabaseConfigured ? 'loading' : 'ready')
  const [liveTxs, setLiveTxs] = useState<SupabaseTransaction[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false
    getAdminAccess().then(async (res) => {
      if (cancelled) return
      setAccess(res.access)
      if (res.access === 'ready') {
        const { transactions, error: e } = await fetchAllTransactions()
        if (!cancelled) {
          setLiveTxs(transactions)
          setError(e)
        }
      } else if (res.access === 'error') {
        setError(res.error ?? 'Failed to check admin access.')
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const demoRows: PlatformTx[] = useMemo(() => {
    const mine: PlatformTx[] = ownTx.map((t) => ({
      id: t.id,
      user: 'You (demo)',
      type: t.type,
      asset: t.asset,
      amount: t.amount,
      date: t.date,
    }))
    return [...mine, ...SEED_PLATFORM_TXS].sort((a, b) => b.date.localeCompare(a.date))
  }, [ownTx])

  const liveRows: PlatformTx[] = useMemo(
    () =>
      liveTxs.map((t) => ({
        id: t.id,
        user: t.userLabel,
        type: t.type,
        asset: t.asset,
        amount: t.amount,
        date: t.created_at,
      })),
    [liveTxs],
  )

  const isLive = isSupabaseConfigured && access === 'ready'
  const rows = (isLive ? liveRows : demoRows).filter((t) => {
    const matchesType = typeFilter === 'all' || t.type === typeFilter
    const q = query.toLowerCase()
    const matchesQ = !q || t.user.toLowerCase().includes(q) || t.asset.toLowerCase().includes(q)
    return matchesType && matchesQ
  })

  const filters = (
    <div className="flex flex-wrap gap-3">
      <Input
        placeholder="Search user or asset…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-xs"
        aria-label="Search transactions"
      />
      <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Filter by type">
        <option value="all">All types</option>
        <option value="deposit">Deposits</option>
        <option value="withdraw">Withdrawals</option>
        <option value="transfer">Transfers</option>
        <option value="swap">Swaps</option>
        <option value="trade">Trades</option>
      </Select>
    </div>
  )

  // Gate: Supabase configured but no admin user session
  if (isSupabaseConfigured && access !== 'ready' && access !== 'loading') {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <SectionHeader title="Transactions" body="The platform ledger requires an admin user session." />
          <DataSourceBadge live={false} />
        </div>
        <Card>
          {access === 'no-session' && (
            <div className="space-y-4 py-4 text-center">
              <p className="text-sm text-ink dark:text-paper">Log in as a user first — the admin PIN alone can't read live data.</p>
              <Button to="/login">Go to log in</Button>
            </div>
          )}
          {access === 'not-admin' && (
            <div className="space-y-4 py-4 text-center">
              <p className="text-sm text-ink dark:text-paper">Your user account doesn't have the admin role.</p>
              <Button to="/admin/users">Open Users</Button>
            </div>
          )}
          {access === 'error' && (
            <div className="p-4"><EmptyState title="Couldn't load live data" body={error ?? 'Unknown error.'} /></div>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <SectionHeader
          title="Transactions"
          body={
            isLive
              ? `Platform-wide ledger from Supabase across ${liveRows.length} recent entries. Read-only.`
              : `Platform-wide demo ledger across ${users.length} users, plus your own demo wallet activity. Read-only.`
          }
        />
        <DataSourceBadge live={isLive} />
      </div>

      {filters}

      <Card className="!p-0 overflow-hidden">
        {access === 'loading' ? (
          <p className="p-8 text-center text-sm text-muted">Connecting to Supabase…</p>
        ) : error && isLive ? (
          <div className="p-8"><EmptyState title="Couldn't load live data" body={error} /></div>
        ) : (
          <TxTable rows={rows} />
        )}
      </Card>
      <p className="text-xs text-muted">
        {isLive
          ? 'Live ledger entries from Supabase. All funds remain simulated.'
          : 'All transactions are simulated. No real funds move.'}
      </p>
    </div>
  )
}
