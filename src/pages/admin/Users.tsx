import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdmin, type AdminUser } from '../../store/admin'
import { useUI } from '../../store/ui'
import { Card, SectionHeader, Badge, Input, Select, Button, EmptyState, Modal } from '../../components/ui'
import DataSourceBadge from '../../components/DataSourceBadge'
import { isSupabaseConfigured } from '../../config/supabase'
import {
  adjustUserBalance,
  fetchProfiles,
  getAdminAccess,
  setUserTxFrozen,
  updateProfileRole,
  updateProfileStatus,
  type AdminAccess,
  type SupabaseProfile,
} from '../../lib/supabaseAdmin'

export default function Users() {
  // Real Supabase users take over when the backend is configured;
  // the demo dataset remains the fallback for the local demo adapter.
  if (isSupabaseConfigured) return <SupabaseUsers />
  return <DemoUsers />
}

/* ------------------------------------------------------------------ */
/* Real users from Supabase (profiles table, RLS-gated)                */
/* ------------------------------------------------------------------ */

function SupabaseUsers() {
  const { pushToast } = useUI()
  const [access, setAccess] = useState<AdminAccess>('loading')
  const [accessEmail, setAccessEmail] = useState<string>('')
  const [accessError, setAccessError] = useState<string>('')
  const [profiles, setProfiles] = useState<SupabaseProfile[]>([])
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pendingStatus, setPendingStatus] = useState<SupabaseProfile | null>(null)
  const [pendingRole, setPendingRole] = useState<{ p: SupabaseProfile; role: 'user' | 'admin' } | null>(null)
  const [pendingAdjust, setPendingAdjust] = useState<SupabaseProfile | null>(null)
  const [pendingFreeze, setPendingFreeze] = useState<SupabaseProfile | null>(null)
  const [adjAsset, setAdjAsset] = useState('USD')
  const [adjAmount, setAdjAmount] = useState('')
  const [adjReason, setAdjReason] = useState('')
  const [adjError, setAdjError] = useState('')

  useEffect(() => {
    let cancelled = false
    getAdminAccess().then((res) => {
      if (cancelled) return
      setAccess(res.access)
      setAccessEmail(res.email ?? '')
      setAccessError(res.error ?? '')
      if (res.access === 'ready') {
        fetchProfiles().then((r) => {
          if (cancelled) return
          if (r.error) {
            setAccess('error')
            setAccessError(r.error)
          } else {
            setProfiles(r.profiles)
          }
        })
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  async function runUpdate(id: string, fn: () => Promise<string | null>, okMsg: string, name: string) {
    setBusyId(id)
    const err = await fn()
    setBusyId(null)
    if (err) {
      pushToast('Update failed', err)
      return
    }
    pushToast(okMsg, name)
    const r = await fetchProfiles()
    if (!r.error) setProfiles(r.profiles)
  }

  async function confirmPendingStatus() {
    const p = pendingStatus
    if (!p) return
    const next = p.status === 'active' ? 'suspended' : 'active'
    setPendingStatus(null)
    await runUpdate(
      p.id,
      () => updateProfileStatus(p.id, next),
      next === 'suspended' ? 'User suspended' : 'User reactivated',
      p.name || p.email || '',
    )
  }

  async function confirmPendingRole() {
    const pr = pendingRole
    if (!pr) return
    setPendingRole(null)
    await runUpdate(
      pr.p.id,
      () => updateProfileRole(pr.p.id, pr.role),
      'Role updated',
      `${pr.p.name || pr.p.email || ''} → ${pr.role}`,
    )
  }

  async function confirmPendingFreeze() {
    const p = pendingFreeze
    if (!p) return
    const next = !p.tx_frozen
    setPendingFreeze(null)
    await runUpdate(
      p.id,
      () => setUserTxFrozen(p.id, next),
      next ? 'Transactions frozen' : 'Transactions unfrozen',
      p.name || p.email || '',
    )
  }

  function openAdjust(p: SupabaseProfile) {
    setAdjAsset('USD')
    setAdjAmount('')
    setAdjReason('')
    setAdjError('')
    setPendingAdjust(p)
  }

  async function confirmPendingAdjust() {
    const p = pendingAdjust
    if (!p) return
    const amount = Number(adjAmount)
    if (!Number.isFinite(amount) || amount === 0) {
      setAdjError('Enter a non-zero amount. Positive credits, negative debits.')
      return
    }
    if (adjReason.trim().length < 3) {
      setAdjError('A reason is required for the audit trail.')
      return
    }
    setBusyId(p.id)
    const err = await adjustUserBalance({ userId: p.id, asset: adjAsset, amount, reason: adjReason })
    setBusyId(null)
    if (err) {
      setAdjError(err)
      return
    }
    setPendingAdjust(null)
    pushToast(
      amount > 0 ? 'Balance credited' : 'Balance debited',
      `${p.name || p.email || ''}: ${amount > 0 ? '+' : ''}${amount} ${adjAsset}`,
    )
    const r = await fetchProfiles()
    if (!r.error) setProfiles(r.profiles)
  }

  const filtered = profiles.filter((p) => {
    const q = query.toLowerCase()
    return !q || p.name.toLowerCase().includes(q) || (p.email ?? '').toLowerCase().includes(q)
  })

  if (access === 'loading') {
    return (
      <div className="space-y-6">
        <SectionHeader title="Users" body="Loading real user accounts…" />
        <Card><p className="py-8 text-center text-sm text-muted">Checking admin access…</p></Card>
      </div>
    )
  }

  if (access === 'no-session') {
    return (
      <div className="space-y-6">
        <SectionHeader title="Users" body="Real Supabase user accounts." />
        <Card>
          <div className="p-8">
            <EmptyState
              title="Log in as a user first"
              body="The admin PIN unlocks this console, but real user data needs your Supabase user session too. Log in with your Meridian account, then come back here."
            />
            <div className="mt-4 text-center">
              <Link to="/login">
                <Button>Go to log in</Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (access === 'not-admin') {
    return (
      <div className="space-y-6">
        <SectionHeader title="Users" body="Real Supabase user accounts." />
        <Card>
          <div className="space-y-4 p-8">
            <EmptyState
              title="Admin role required"
              body={`Signed in as ${accessEmail || 'a user account'}, which does not have the admin role. Run this in the Supabase SQL editor to grant it:`}
            />
            <pre className="overflow-x-auto rounded-xl bg-ink p-4 text-left font-mono text-xs text-paper dark:bg-black">
              {`update public.profiles set role = 'admin'\nwhere email = '${accessEmail || 'you@example.com'}';`}
            </pre>
          </div>
        </Card>
      </div>
    )
  }

  if (access === 'error') {
    return (
      <div className="space-y-6">
        <SectionHeader title="Users" body="Real Supabase user accounts." />
        <Card>
          <div className="p-8">
            <EmptyState title="Couldn't load users" body={accessError || 'Something went wrong.'} />
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Users"
        body={`${profiles.length} real accounts from Supabase. Suspension is enforced at login; freeze blocks money movement without locking the account.`}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
          aria-label="Search users"
        />
        <DataSourceBadge live />
      </div>

      <Card className="!p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No users found"
              body={query ? 'Try a different search.' : 'No accounts have signed up yet.'}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wider text-muted dark:border-[#2a2a2d]">
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-line last:border-0 dark:border-[#2a2a2d]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink dark:text-paper">{p.name || '—'}</p>
                      <p className="text-xs text-muted">{p.email ?? p.id.slice(0, 8)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={p.role}
                        disabled={busyId === p.id}
                        onChange={(e) => setPendingRole({ p, role: e.target.value as 'user' | 'admin' })}
                        aria-label={`Role for ${p.name || p.email}`}
                        className="!w-auto !py-1 text-xs"
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge tone={p.status === 'active' ? 'green' : 'red'}>{p.status}</Badge>
                        {p.tx_frozen && <Badge tone="amber">frozen</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(p.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busyId === p.id}
                          onClick={() => openAdjust(p)}
                        >
                          Adjust
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busyId === p.id}
                          onClick={() => setPendingFreeze(p)}
                        >
                          {p.tx_frozen ? 'Unfreeze' : 'Freeze'}
                        </Button>
                        <Button
                          size="sm"
                          variant={p.status === 'active' ? 'secondary' : 'primary'}
                          disabled={busyId === p.id}
                          onClick={() => setPendingStatus(p)}
                        >
                          {p.status === 'active' ? 'Suspend' : 'Reactivate'}
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

      <Modal
        open={pendingStatus !== null}
        onClose={() => setPendingStatus(null)}
        title={pendingStatus && pendingStatus.status === 'active' ? 'Suspend user?' : 'Reactivate user?'}
      >
        {pendingStatus && (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              {pendingStatus.status === 'active' ? (
                <>
                  <span className="font-semibold text-ink dark:text-paper">{pendingStatus.name || pendingStatus.email}</span>{' '}
                  will be signed out and blocked from logging in until reactivated.
                </>
              ) : (
                <>
                  <span className="font-semibold text-ink dark:text-paper">{pendingStatus.name || pendingStatus.email}</span>{' '}
                  will be able to log in again.
                </>
              )}
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setPendingStatus(null)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={() => void confirmPendingStatus()} className="flex-1">
                {pendingStatus.status === 'active' ? 'Suspend user' : 'Reactivate user'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={pendingRole !== null}
        onClose={() => setPendingRole(null)}
        title="Change role?"
      >
        {pendingRole && (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Change <span className="font-semibold text-ink dark:text-paper">{pendingRole.p.name || pendingRole.p.email}</span>{' '}
              from <span className="font-mono">{pendingRole.p.role}</span> to{' '}
              <span className="font-mono">{pendingRole.role}</span>?
              {pendingRole.role === 'admin' && ' Admins can read every profile and manage users.'}
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setPendingRole(null)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={() => void confirmPendingRole()} className="flex-1">
                Change role
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={pendingFreeze !== null}
        onClose={() => setPendingFreeze(null)}
        title={pendingFreeze?.tx_frozen ? 'Unfreeze transactions?' : 'Freeze transactions?'}
      >
        {pendingFreeze && (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              {pendingFreeze.tx_frozen ? (
                <>
                  <span className="font-semibold text-ink dark:text-paper">{pendingFreeze.name || pendingFreeze.email}</span>{' '}
                  will be able to deposit, withdraw, transfer and swap again.
                </>
              ) : (
                <>
                  <span className="font-semibold text-ink dark:text-paper">{pendingFreeze.name || pendingFreeze.email}</span>{' '}
                  will be blocked from deposits, withdrawals, transfers and swaps until unfrozen. They can still
                  log in and view their balances. Unlike suspension, this does not lock them out.
                </>
              )}
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setPendingFreeze(null)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={() => void confirmPendingFreeze()} className="flex-1">
                {pendingFreeze.tx_frozen ? 'Unfreeze' : 'Freeze transactions'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={pendingAdjust !== null}
        onClose={() => setPendingAdjust(null)}
        title="Adjust balance"
      >
        {pendingAdjust && (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Credit or debit{' '}
              <span className="font-semibold text-ink dark:text-paper">{pendingAdjust.name || pendingAdjust.email}</span>
              's wallet. The reason is written to the ledger as the audit trail. Positive amounts credit,
              negative amounts debit.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-ink dark:text-paper">Asset</span>
                <Select value={adjAsset} onChange={(e) => setAdjAsset(e.target.value)} aria-label="Asset">
                  <option value="USD">USD</option>
                  <option value="BTC">BTC</option>
                  <option value="ETH">ETH</option>
                  <option value="SOL">SOL</option>
                </Select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-ink dark:text-paper">Amount</span>
                <Input
                  id="adj-amount"
                  type="number"
                  step="any"
                  placeholder="+100 or -50"
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(e.target.value)}
                  aria-label="Amount (positive credits, negative debits)"
                />
              </label>
            </div>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-ink dark:text-paper">Reason (audit trail)</span>
              <Input
                placeholder="e.g. Goodwill credit for outage on Oct 1"
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                aria-label="Reason for adjustment"
              />
            </label>
            {adjError && <p className="text-sm text-red-600 dark:text-red-400">{adjError}</p>}
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setPendingAdjust(null)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => void confirmPendingAdjust()}
                disabled={busyId === pendingAdjust.id}
                className="flex-1"
              >
                Apply adjustment
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Demo dataset fallback (local demo adapter)                          */
/* ------------------------------------------------------------------ */

function DemoUsers() {
  const { users, updateUserStatus, updateUserTier } = useAdmin()
  const { pushToast } = useUI()
  const [query, setQuery] = useState('')
  const [tierFilter, setTierFilter] = useState('all')
  const [pendingStatus, setPendingStatus] = useState<AdminUser | null>(null)
  const [pendingTier, setPendingTier] = useState<{ u: AdminUser; tier: AdminUser['tier'] } | null>(null)

  const filtered = users.filter((u) => {
    const q = query.toLowerCase()
    const matchesQ = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    const matchesTier = tierFilter === 'all' || u.tier === tierFilter
    return matchesQ && matchesTier
  })

  const toggleStatus = (u: AdminUser) => {
    setPendingStatus(u)
  }

  const confirmPendingStatus = () => {
    if (!pendingStatus) return
    const next = pendingStatus.status === 'active' ? 'suspended' : 'active'
    updateUserStatus(pendingStatus.id, next)
    pushToast(next === 'suspended' ? 'User suspended' : 'User reactivated', pendingStatus.name)
    setPendingStatus(null)
  }

  const confirmPendingTier = () => {
    if (!pendingTier) return
    updateUserTier(pendingTier.u.id, pendingTier.tier)
    pushToast('Tier updated', `${pendingTier.u.name} → ${pendingTier.tier}`)
    setPendingTier(null)
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Users" body={`${users.length} demo accounts. Suspend or change tiers — changes apply to simulated data only.`} />

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
          aria-label="Search users"
        />
        <Select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} aria-label="Filter by tier">
          <option value="all">All tiers</option>
          <option value="Standard">Standard</option>
          <option value="Plus">Plus</option>
          <option value="Elite">Elite</option>
        </Select>
      </div>

      <Card className="!p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8"><EmptyState title="No users found" body="Try a different search or tier filter." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wider text-muted dark:border-[#2a2a2d]">
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Tier</th>
                  <th className="px-4 py-3 font-medium">Balance</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-line last:border-0 dark:border-[#2a2a2d]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink dark:text-paper">{u.name}</p>
                      <p className="text-xs text-muted">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={u.tier}
                        onChange={(e) => setPendingTier({ u, tier: e.target.value as AdminUser['tier'] })}
                        aria-label={`Tier for ${u.name}`}
                        className="!w-auto !py-1 text-xs"
                      >
                        <option value="Standard">Standard</option>
                        <option value="Plus">Plus</option>
                        <option value="Elite">Elite</option>
                      </Select>
                    </td>
                    <td className="px-4 py-3 font-mono text-ink dark:text-paper">
                      ${u.balance.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={u.status === 'active' ? 'green' : 'red'}>{u.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted">{u.joined}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant={u.status === 'active' ? 'secondary' : 'primary'}
                        onClick={() => toggleStatus(u)}
                      >
                        {u.status === 'active' ? 'Suspend' : 'Reactivate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={pendingStatus !== null}
        onClose={() => setPendingStatus(null)}
        title={pendingStatus && pendingStatus.status === 'active' ? 'Suspend user?' : 'Reactivate user?'}
      >
        {pendingStatus && (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              {pendingStatus.status === 'active' ? (
                <>
                  <span className="font-semibold text-ink dark:text-paper">{pendingStatus.name}</span> will be
                  blocked from this demo until reactivated. This applies to simulated data only.
                </>
              ) : (
                <>
                  <span className="font-semibold text-ink dark:text-paper">{pendingStatus.name}</span> will be
                  reactivated.
                </>
              )}
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setPendingStatus(null)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={confirmPendingStatus} className="flex-1">
                {pendingStatus.status === 'active' ? 'Suspend user' : 'Reactivate user'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={pendingTier !== null} onClose={() => setPendingTier(null)} title="Change tier?">
        {pendingTier && (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Change <span className="font-semibold text-ink dark:text-paper">{pendingTier.u.name}</span> from{' '}
              {pendingTier.u.tier} to {pendingTier.tier}? This applies to simulated data only.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setPendingTier(null)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={confirmPendingTier} className="flex-1">
                Change tier
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
