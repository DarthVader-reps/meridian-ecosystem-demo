import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdmin, type AdminUser } from '../../store/admin'
import { useUI } from '../../store/ui'
import { Card, SectionHeader, Badge, Input, Select, Button, EmptyState } from '../../components/ui'
import DataSourceBadge from '../../components/DataSourceBadge'
import { isSupabaseConfigured } from '../../config/supabase'
import {
  fetchProfiles,
  getAdminAccess,
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
        body={`${profiles.length} real accounts from Supabase. Suspension is enforced at login.`}
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
                        onChange={(e) =>
                          runUpdate(
                            p.id,
                            () => updateProfileRole(p.id, e.target.value as 'user' | 'admin'),
                            'Role updated',
                            p.name || p.email || '',
                          )
                        }
                        aria-label={`Role for ${p.name || p.email}`}
                        className="!w-auto !py-1 text-xs"
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={p.status === 'active' ? 'green' : 'red'}>{p.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(p.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant={p.status === 'active' ? 'secondary' : 'primary'}
                        disabled={busyId === p.id}
                        onClick={() => {
                          const next = p.status === 'active' ? 'suspended' : 'active'
                          void runUpdate(
                            p.id,
                            () => updateProfileStatus(p.id, next),
                            next === 'suspended' ? 'User suspended' : 'User reactivated',
                            p.name || p.email || '',
                          )
                        }}
                      >
                        {p.status === 'active' ? 'Suspend' : 'Reactivate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
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

  const filtered = users.filter((u) => {
    const q = query.toLowerCase()
    const matchesQ = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    const matchesTier = tierFilter === 'all' || u.tier === tierFilter
    return matchesQ && matchesTier
  })

  const toggleStatus = (u: AdminUser) => {
    const next = u.status === 'active' ? 'suspended' : 'active'
    updateUserStatus(u.id, next)
    pushToast(next === 'suspended' ? 'User suspended' : 'User reactivated', u.name)
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
                        onChange={(e) => {
                          updateUserTier(u.id, e.target.value as AdminUser['tier'])
                          pushToast('Tier updated', `${u.name} → ${e.target.value}`)
                        }}
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
    </div>
  )
}
