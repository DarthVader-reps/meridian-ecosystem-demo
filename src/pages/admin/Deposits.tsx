import { useCallback, useEffect, useMemo, useState } from 'react'
import { Page } from '../../components/layout'
import { Badge, Button, Card, EmptyState, SectionHeader } from '../../components/ui'
import DataSourceBadge from '../../components/DataSourceBadge'
import { isSupabaseConfigured } from '../../config/supabase'
import { useUI } from '../../store/ui'
import { fetchProfiles, profileLabel, type SupabaseProfile } from '../../lib/supabaseAdmin'
import {
  clearDepositRequest,
  fetchAllDepositRequests,
  rejectDepositRequest,
  type ServerDepositRequest,
} from '../../lib/depositServer'
import { formatQty } from '../../lib/market'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function toneFor(status: string): 'accent' | 'green' | 'red' | 'neutral' {
  switch (status) {
    case 'pending_clearance': return 'accent'
    case 'cleared': return 'green'
    case 'rejected': return 'red'
    default: return 'neutral'
  }
}

function labelFor(status: string): string {
  switch (status) {
    case 'pending_clearance': return 'Pending clearance'
    case 'cleared': return 'Cleared'
    case 'rejected': return 'Rejected'
    default: return status
  }
}

export default function AdminDeposits() {
  const { pushToast } = useUI()
  const [rows, setRows] = useState<ServerDepositRequest[]>([])
  const [profiles, setProfiles] = useState<SupabaseProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [acting, setActing] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const [{ rows, error }, { profiles }] = await Promise.all([
      fetchAllDepositRequests(),
      fetchProfiles(),
    ])
    setRows(rows)
    setProfiles(profiles)
    setError(error)
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const labelById = useMemo(() => {
    const m = new Map<string, string>()
    for (const p of profiles) m.set(p.id, profileLabel(p))
    return m
  }, [profiles])

  const pending = rows.filter((r) => r.status === 'pending_clearance')
  const decided = rows.filter((r) => r.status === 'cleared' || r.status === 'rejected')

  async function decide(id: string, action: 'clear' | 'reject') {
    const row = rows.find((r) => r.id === id)
    if (!row) return
    const verb = action === 'clear' ? 'Clear' : 'Reject'
    if (!window.confirm(`${verb} this ${row.asset} deposit of ${formatQty(Number(row.amount))}?`)) return
    setActing(id)
    const err = action === 'clear' ? await clearDepositRequest(id) : await rejectDepositRequest(id)
    setActing(null)
    if (err) {
      pushToast(`${verb} failed`, err)
      return
    }
    pushToast(
      action === 'clear' ? 'Deposit cleared' : 'Deposit rejected',
      `${formatQty(Number(row.amount))} ${row.asset} — ${labelById.get(row.user_id) ?? row.user_id}`,
    )
    void load()
  }

  return (
    <Page
      title="Deposits"
      intro="Clear or reject user deposits. Clearing credits the user's balance atomically. All money is simulated."
      disclaimer
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <DataSourceBadge live={isSupabaseConfigured} />
        <Button variant="secondary" onClick={() => void load()} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </Button>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <SectionHeader title="Pending clearance" body={`${pending.length} awaiting a decision.`} />
      <Card className="mt-3 !p-0 overflow-hidden">
        {loading ? (
          <div className="p-8"><EmptyState title="Loading…" body="Fetching deposit requests." /></div>
        ) : pending.length === 0 ? (
          <div className="p-8"><EmptyState title="Nothing pending" body="New deposits appear here after network confirmation." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wider text-muted dark:border-[#2a2a2d]">
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Asset</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Network</th>
                  <th className="px-4 py-3 font-medium">Requested</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((r) => (
                  <tr key={r.id} className="border-b border-line last:border-0 dark:border-[#2a2a2d]">
                    <td className="px-4 py-3 font-medium text-ink dark:text-paper">{labelById.get(r.user_id) ?? r.user_id.slice(0, 8)}</td>
                    <td className="px-4 py-3">{r.asset}</td>
                    <td className="px-4 py-3">{formatQty(Number(r.amount))}</td>
                    <td className="px-4 py-3 text-muted">{r.network.replace(' (simulated)', '')}</td>
                    <td className="px-4 py-3 text-muted">{fmtDate(r.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button size="sm" disabled={acting === r.id} onClick={() => void decide(r.id, 'clear')}>
                          {acting === r.id ? 'Working…' : 'Clear'}
                        </Button>
                        <Button size="sm" variant="secondary" disabled={acting === r.id} onClick={() => void decide(r.id, 'reject')}>
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="mt-8">
        <SectionHeader title="Recently decided" body={`${decided.length} cleared or rejected.`} />
        <Card className="mt-3">
          {decided.length === 0 ? (
            <EmptyState title="No decisions yet" body="Cleared and rejected deposits will appear here." />
          ) : (
            <ul className="divide-y divide-line dark:divide-[#2a2a2d]">
              {decided.slice(0, 20).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-ink dark:text-paper">
                      {formatQty(Number(r.amount))} {r.asset}
                      <span className="ml-2 font-normal text-muted">{labelById.get(r.user_id) ?? r.user_id.slice(0, 8)}</span>
                    </p>
                    <p className="text-xs text-muted">
                      {fmtDate(r.created_at)}{r.decided_at ? ` · decided ${fmtDate(r.decided_at)}` : ''}
                    </p>
                  </div>
                  <Badge tone={toneFor(r.status)}>{labelFor(r.status)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </Page>
  )
}
