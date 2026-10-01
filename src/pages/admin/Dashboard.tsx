import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { useAdmin } from '../../store/admin'
import { Card, Stat, SectionHeader, Badge } from '../../components/ui'

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

export default function Dashboard() {
  const { users, assets, plans, vehicles, giveaways, activity, settings } = useAdmin()

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
      <SectionHeader
        title="Overview"
        body="Simulated platform metrics. All figures are demo data stored in your browser."
      />

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
        <Card>
          <h3 className="text-base font-semibold text-ink dark:text-paper">Quick actions</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              { to: '/admin/users', label: 'Manage users', desc: 'Suspend, activate, change tiers' },
              { to: '/admin/assets', label: 'Manage assets', desc: 'Add or edit tradeable assets' },
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
      </div>
    </div>
  )
}
