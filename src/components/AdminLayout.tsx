import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAdmin } from '../store/admin'
import { Button } from './ui'

const LINKS = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/assets', label: 'Assets' },
  { to: '/admin/plans', label: 'Plans' },
  { to: '/admin/vehicles', label: 'Vehicles' },
  { to: '/admin/transactions', label: 'Transactions' },
  { to: '/admin/deposits', label: 'Deposits' },
  { to: '/admin/giveaways', label: 'Giveaways' },
  { to: '/admin/settings', label: 'Settings' },
]

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAdmin()
  const navigate = useNavigate()
  if (!isAdmin) {
    navigate('/admin/login', { replace: true })
    return null
  }
  return <>{children}</>
}

export default function AdminLayout() {
  const { logout, settings } = useAdmin()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {settings.maintenanceMode && (
        <div className="mb-6 rounded-xl bg-amber-500 px-4 py-2.5 text-center" role="alert" aria-label="Maintenance mode notice">
          <p className="text-xs font-semibold tracking-wide text-white">
            Maintenance mode is on — user-facing demo actions show a paused banner.
          </p>
        </div>
      )}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent)]">Admin console</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink dark:text-paper">
            {settings.platformName} admin
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {settings.maintenanceMode && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
              Maintenance mode
            </span>
          )}
          <Button variant="secondary" size="sm" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Admin" className="lg:sticky lg:top-20 lg:self-start">
          <ul className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {LINKS.map((l) => (
              <li key={l.to} className="shrink-0">
                <NavLink
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    `block rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-ink text-white dark:bg-paper dark:text-ink'
                        : 'text-muted hover:bg-mist hover:text-ink dark:hover:bg-ink-soft dark:hover:text-paper'
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
