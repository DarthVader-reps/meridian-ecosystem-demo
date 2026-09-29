import { Page } from '../../components/layout'
import { Card, Toggle } from '../../components/ui'
import { useAccount } from '../../store/account'
import { useUI } from '../../store/ui'

const ROWS = [
  { key: 'market' as const, title: 'Market updates', body: 'Simulated price movements and market summaries.' },
  { key: 'product' as const, title: 'Product news', body: 'New demo features and changes to the prototype.' },
  { key: 'security' as const, title: 'Security alerts', body: 'Sign-ins and security changes on your demo account.' },
]

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
    <Page title="Notifications" intro="Choose which simulated alerts you receive. All money is simulated." disclaimer>
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
