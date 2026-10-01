import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { useAdmin } from '../../store/admin'
import { Card, Stat, SectionHeader, Badge, Button, EmptyState } from '../../components/ui'
import DataSourceBadge from '../../components/DataSourceBadge'
import { isSupabaseConfigured } from '../../config/supabase'
import {
  getAdminAccess,
  fetchAdminDashboardStats,
  type AdminAccess,
  type AdminDashboardStats,
} from '../../lib/supabaseAdmin'

const VOLUME_DATA = [
  { day: 'Mon', volume: 1.2, users: 42 },
  { day: 'Tue', volume: 1.9, users: 58 },
  { day: 'Wed', volume: 1.5, users: 47 },
  { day: 'Thu', volume: 2.4, users: 71 },
  { day: 'Fri', volume: 3.1, users: 89 },
  { day: 'Sat', volume: 2.2, users: 63 },
  { day: 'Sun', volume: 1.8, users: 51 },
]

const TIER_DATA = [
  { tier: 'Standard', count: 4 },
  { tier: 'Plus', count: 3 },
  { tier: 'Elite', count: 2 },
]

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function fmtAmount(t: { amount: number; asset: string }) {
  return `${t.amount < 0 ? '' : '+'}${t.amount.toLocaleString()} ${t.asset}`
}

export default function Dashboard() {
  const { users, assets, plans, vehicles, giveaways, activity, settings } = useAdmin()
  const [access, setAccess] = useState<AdminAccess>(isSupabaseConfigured ? 'loading' : 'ready')
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false
    getAdminAccess().then(async (res) => {
      if (cancelled) return
      setAccess(res.access)
      if (res.access === 'ready') {
        const { stats: s, error: e } = await fetchAdminDashboardStats()
        if (!cancelled) {
          setStats(s)
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

  // ---------------------------------------------------------------
  // Demo mode — Supabase not configured: original browser-local UI
  // ---------------------------------------------------------------
  if (!isSupabaseConfigured) {
    const activeUsers = users.filter((u) => u.status === 'active').length
    const suspendedUsers = users.filter((u) => u.status === 'suspended')
    const totalBalance = users.reduce((s, u) => s + u.balance, 0)
    const activeGiveaways = giveaways.filter((g) => g.status === 'active').length

    const alerts: Array<{ label: string; to: string; tone: 'red' | 'amber' }> = []
    if (suspendedUsers.length > 0) {
      alerts.push({ label: `${suspendedUsers.length} suspended user${suspendedUsers.length > 1 ? 's' : ''} need review`, to: '/admin/users', tone: 'red' })
    }
    if (activeGiveaways > 0) {
      alerts.push({ label: `${activeGiveaways} active giveaway${activeGiveaways > 1 ? 's' : ''} awaiting draw`, to: '/admin/giveaways', tone: 'amber' })
    }
    if (settings.maintenanceMode) {
      alerts.push({ label: 'Maintenance mode is ON — demo actions blocked', to: '/admin/settings', tone: 'amber' })
    }

    return (
      <div className="space-y-8">
        <div className="flex items-start justify-between gap-4">
          <SectionHeader
            title="Overview"
            body="Simulated platform metrics. All figures are demo data stored in your browser."
          />
          <DataSourceBadge live={false} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card><Stat label="Total users" value={String(users.length)} sub={<span>{activeUsers} active</span>} /></Card>
          <Card><Stat label="Assets listed" value={String(assets.length)} sub={<span>{plans.length} investment plans</span>} /></Card>
          <Card><Stat label="Vehicles" value={String(vehicles.length)} sub={<span>{activeGiveaways} active giveaways</span>} /></Card>
          <Card>
            <Stat
              label="User balances"
              value={`$${(totalBalance / 1000).toFixed(0)}K`}
              sub={<span>Demo funds under management</span>}
            />
          </Card>
        </div>

        {alerts.length > 0 && (
          <Card className="!border-amber-200 dark:!border-amber-900/40">
            <h3 className="text-base font-semibold text-ink dark:text-paper">Needs attention</h3>
            <ul className="mt-3 space-y-2">
              {alerts.map((a) => (
                <li key={a.label}>
                  <Link to={a.to} className="flex items-center gap-2 text-sm hover:underline">
                    <Badge tone={a.tone}>{a.tone === 'red' ? 'Action' : 'Notice'}</Badge>
                    <span className="text-ink dark:text-paper">{a.label} →</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h3 className="text-base font-semibold text-ink dark:text-paper">Weekly volume (demo $M)</h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={VOLUME_DATA} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e7e5" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="volume" stroke="#1b5cff" fill="#1b5cff" fillOpacity={0.15} name="Volume $M" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card>
            <h3 className="text-base font-semibold text-ink dark:text-paper">Users by tier</h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={TIER_DATA} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e7e5" />
                  <XAxis dataKey="tier" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1b5cff" radius={[4, 4, 0, 0]} name="Users" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-ink dark:text-paper">Recent activity</h3>
              <Badge tone={settings.maintenanceMode ? 'amber' : 'green'}>
                {settings.maintenanceMode ? 'Maintenance' : 'Operational'}
              </Badge>
            </div>
            <ul className="mt-4 space-y-3">
              {activity.slice(0, 6).map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-4 border-b border-line pb-3 last:border-0 dark:border-[#2a2a2d]">
                  <div>
                    <p className="text-sm font-medium text-ink dark:text-paper">{a.action}</p>
                    <p className="text-xs text-muted">{a.detail}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted">{fmtDate(a.date)}</span>
                </li>
              ))}
            </ul>
          </Card>
          <QuickActions />
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------
  // Live mode — Supabase configured
  // ---------------------------------------------------------------
  if (access === 'loading') {
    return (
      <div className="space-y-8">
        <SectionHeader title="Overview" body="Loading live platform metrics…" />
        <Card><p className="py-8 text-center text-sm text-muted">Connecting to Supabase…</p></Card>
      </div>
    )
  }

  if (access !== 'ready') {
    return (
      <div className="space-y-8">
        <div className="flex items-start justify-between gap-4">
          <SectionHeader title="Overview" body="Live platform metrics require an admin user session." />
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
              <p className="text-xs text-muted">Ask an existing admin to grant it, or run the SQL from the Users page.</p>
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

  if (error || !stats) {
    return (
      <div className="space-y-8">
        <div className="flex items-start justify-between gap-4">
          <SectionHeader title="Overview" body="Live platform metrics from Supabase." />
          <DataSourceBadge live />
        </div>
        <Card><div className="p-4"><EmptyState title="Couldn't load live data" body={error ?? 'Unknown error.'} /></div></Card>
      </div>
    )
  }

  const alerts: Array<{ label: string; to: string; tone: 'red' | 'amber' }> = []
  if (stats.suspendedUsers > 0) {
    alerts.push({ label: `${stats.suspendedUsers} suspended user${stats.suspendedUsers > 1 ? 's' : ''} need review`, to: '/admin/users', tone: 'red' })
  }
  if (settings.maintenanceMode) {
    alerts.push({ label: 'Maintenance mode is ON — demo actions blocked', to: '/admin/settings', tone: 'amber' })
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <SectionHeader title="Overview" body="Live platform metrics from Supabase." />
        <DataSourceBadge live />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <Stat
            label="Total users"
            value={String(stats.totalUsers)}
            sub={<span>{stats.activeUsers} active · {stats.adminCount} admin{stats.adminCount === 1 ? '' : 's'}</span>}
          />
        </Card>
        <Card>
          <Stat
            label="Suspended users"
            value={String(stats.suspendedUsers)}
            sub={<span>{stats.suspendedUsers > 0 ? 'Need review' : 'All clear'}</span>}
          />
        </Card>
        <Card>
          <Stat
            label="Ledger transactions"
            value={String(stats.totalTransactions)}
            sub={<span>Across all users</span>}
          />
        </Card>
        <Card>
          <Stat
            label="New signups (7d)"
            value={String(stats.signupsLast7d)}
            sub={<span>Last 7 days</span>}
          />
        </Card>
      </div>

      {alerts.length > 0 && (
        <Card className="!border-amber-200 dark:!border-amber-900/40">
          <h3 className="text-base font-semibold text-ink dark:text-paper">Needs attention</h3>
          <ul className="mt-3 space-y-2">
            {alerts.map((a) => (
              <li key={a.label}>
                <Link to={a.to} className="flex items-center gap-2 text-sm hover:underline">
                  <Badge tone={a.tone}>{a.tone === 'red' ? 'Action' : 'Notice'}</Badge>
                  <span className="text-ink dark:text-paper">{a.label} →</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="text-base font-semibold text-ink dark:text-paper">New signups — last 7 days</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.signupSeries} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e7e5" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="signups" fill="#1b5cff" radius={[4, 4, 0, 0]} name="Signups" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h3 className="text-base font-semibold text-ink dark:text-paper">Transactions by type</h3>
          {stats.txTypeSeries.length === 0 ? (
            <div className="py-8"><EmptyState title="No transactions yet" body="Ledger entries will appear here as users transact." /></div>
          ) : (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.txTypeSeries} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e7e5" />
                  <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="type" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1b5cff" radius={[0, 4, 4, 0]} name="Transactions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-ink dark:text-paper">Recent ledger activity</h3>
            <Badge tone={settings.maintenanceMode ? 'amber' : 'green'}>
              {settings.maintenanceMode ? 'Maintenance' : 'Operational'}
            </Badge>
          </div>
          {stats.recent.length === 0 ? (
            <div className="py-6"><EmptyState title="No activity yet" body="Transactions from real users will show here." /></div>
          ) : (
            <ul className="mt-4 space-y-3">
              {stats.recent.map((t) => (
                <li key={t.id} className="flex items-start justify-between gap-4 border-b border-line pb-3 last:border-0 dark:border-[#2a2a2d]">
                  <div>
                    <p className="text-sm font-medium capitalize text-ink dark:text-paper">{t.type}</p>
                    <p className="text-xs text-muted">{t.userLabel}{t.detail ? ` · ${t.detail}` : ''}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`font-mono text-sm ${t.amount < 0 ? 'text-red-600' : 'text-ink dark:text-paper'}`}>{fmtAmount(t)}</p>
                    <p className="text-xs text-muted">{fmtDate(t.created_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <QuickActions />
      </div>
    </div>
  )
}

function QuickActions() {
  return (
    <Card>
      <h3 className="text-base font-semibold text-ink dark:text-paper">Quick actions</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[
          { to: '/admin/users', label: 'Manage users', desc: 'Suspend, activate, change roles' },
          { to: '/admin/transactions', label: 'Transactions', desc: 'Platform-wide ledger' },
          { to: '/admin/giveaways', label: 'Giveaways', desc: 'Pick winners, create draws' },
          { to: '/admin/settings', label: 'Settings', desc: 'Fees, limits, maintenance' },
        ].map((q) => (
          <Link
            key={q.to}
            to={q.to}
            className="rounded-xl border border-line p-4 transition-colors hover:border-[var(--color-accent)] dark:border-[#2a2a2d]"
          >
            <p className="text-sm font-semibold text-ink dark:text-paper">{q.label}</p>
            <p className="mt-1 text-xs text-muted">{q.desc}</p>
          </Link>
        ))}
      </div>
    </Card>
  )
}
