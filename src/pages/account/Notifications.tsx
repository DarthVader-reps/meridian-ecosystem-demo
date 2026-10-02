import { Link } from 'react-router-dom'
import { Page } from '../../components/layout'
import { Badge, Button, Card, EmptyState, Toggle } from '../../components/ui'
import { useAccount } from '../../store/account'
import { useNotifications, type NotifyKind } from '../../store/notifications'
import { useUI } from '../../store/ui'

const ROWS = [
  { key: 'market' as const, title: 'Market updates', body: 'Simulated price movements and market summaries.' },
  { key: 'product' as const, title: 'Product news', body: 'New features and changes.' },
  { key: 'security' as const, title: 'Security alerts', body: 'Sign-ins and security changes on your account.' },
]

function kindTone(kind: NotifyKind): 'green' | 'red' | 'accent' | 'neutral' {
  switch (kind) {
    case 'success': return 'green'
    case 'error': return 'red'
    case 'warning': return 'accent'
    default: return 'neutral'
  }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function Inbox() {
  const { notifications, markRead, markAllRead, clearRead } = useNotifications()
  const unread = notifications.filter((n) => !n.read).length
  return (
    <Card className="mb-6 max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-ink dark:text-paper">
          Inbox {unread > 0 && <span className="ml-1 text-sm font-normal text-muted">({unread} unread)</span>}
        </h3>
        <div className="flex gap-2">
          {unread > 0 && (
            <Button variant="secondary" onClick={markAllRead}>
              Mark all read
            </Button>
          )}
          {notifications.some((n) => n.read) && (
            <Button variant="secondary" onClick={clearRead}>
              Clear read
            </Button>
          )}
        </div>
      </div>
      {notifications.length === 0 ? (
        <div className="pt-2">
          <EmptyState title="No notifications yet" body="Deposits, security events, and product news will appear here." />
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-line dark:divide-[#2a2a2d]">
          {notifications.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => markRead(n.id)}
                className={`flex w-full items-start gap-3 py-3 text-left ${n.read ? 'opacity-70' : ''}`}
              >
                <Badge tone={kindTone(n.kind)}>{n.kind}</Badge>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-ink dark:text-paper">
                    {!n.read && <span aria-hidden="true" className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[var(--color-accent)]" />}
                    {n.title}
                  </span>
                  {n.body && <span className="mt-0.5 block text-sm text-muted">{n.body}</span>}
                  <span className="mt-0.5 block text-xs text-muted">{fmtDate(n.createdAt)}</span>
                </span>
                {n.link && (
                  <Link
                    to={n.link}
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 text-sm font-medium text-[var(--color-accent)] hover:underline"
                  >
                    View →
                  </Link>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export default function Notifications() {
  const { notifications, setNotifications } = useAccount()
  const { pushToast } = useUI()

  function toggle(key: (typeof ROWS)[number]['key']) {
    const next = !notifications[key]
    setNotifications({ [key]: next })
    const row = ROWS.find((r) => r.key === key)
    pushToast(
      next ? `${row?.title} enabled` : `${row?.title} disabled`,
      'Simulated notification preference.',
    )
  }

  return (
    <Page title="Notifications" intro="Your alerts inbox and preferences. All money is simulated." disclaimer>
      <Inbox />
      <Card className="max-w-2xl">
        <ul className="divide-y divide-line dark:divide-[#2a2a2d]">
          {ROWS.map((row) => (
            <li key={row.key} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-semibold text-ink dark:text-paper">{row.title}</p>
                <p className="mt-1 text-sm text-muted">{row.body}</p>
              </div>
              <Toggle
                checked={notifications[row.key]}
                onChange={() => toggle(row.key)}
                label={row.title}
              />
            </li>
          ))}
        </ul>
      </Card>
    </Page>
  )
}
