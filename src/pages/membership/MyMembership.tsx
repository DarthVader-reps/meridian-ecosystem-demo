import { Page } from '../../components/layout'
import { Badge, Button, Card } from '../../components/ui'
import { useMembership, type MemberTier } from '../../store/membership'
import { useUI } from '../../store/ui'
import { formatMoney } from '../../lib/market'
import tiersData from '../../mock/tiers.json'

interface Tier {
  id: string
  name: string
  price: number
  priceNote: string
  benefits: string[]
}

const tiers = tiersData as Tier[]

export default function MyMembership() {
  const tier = useMembership((s) => s.tier)
  const setTier = useMembership((s) => s.setTier)
  const pushToast = useUI((s) => s.pushToast)

  const current = tiers.find((t) => t.id === tier) ?? tiers[0]
  const others = tiers.filter((t) => t.id !== tier)

  const switchTo = (t: Tier) => {
    setTier(t.id as MemberTier)
    pushToast('Membership updated', `You are now on ${t.name}.`)
  }

  return (
    <Page title="My membership" intro="Your current plan and how to change it.">
      <Card className="max-w-2xl">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-semibold text-ink dark:text-paper">{current.name}</h2>
          <Badge tone="accent">Current</Badge>
        </div>
        <p className="mt-2">
          <span className="text-3xl font-semibold tracking-tight text-ink dark:text-paper">
            {formatMoney(current.price, 0)}
          </span>{' '}
          <span className="text-sm text-muted">{current.priceNote}</span>
        </p>
        <ul className="mt-4 space-y-2 text-sm text-muted">
          {current.benefits.map((b) => (
            <li key={b} className="flex gap-2">
              <span aria-hidden="true" className="text-[var(--color-accent)]">–</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          {others.map((t) => (
            <Button
              key={t.id}
              variant="secondary"
              onClick={() => switchTo(t)}
            >
              {t.price > current.price ? `Upgrade to ${t.name}` : `Downgrade to ${t.name}`}
            </Button>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted">Simulated billing — no real charges.</p>
      </Card>
      <div className="mt-6">
        <Button to="/membership" variant="ghost">
          Compare all plans
        </Button>
      </div>
    </Page>
  )
}
