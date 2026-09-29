import { Page } from '../../components/layout'
import { Badge, Button, Card, EmptyState } from '../../components/ui'
import { useMembership } from '../../store/membership'
import { formatMoney } from '../../lib/market'
import vipData from '../../mock/vip.json'

interface Vip {
  id: string
  name: string
  price: number
  priceNote: string
  benefits: string[]
}

const vipTiers = vipData as Vip[]

export default function MyVip() {
  const vip = useMembership((s) => s.vip)

  if (vip === 'none') {
    return (
      <Page title="My VIP" intro="Your VIP status.">
        <EmptyState
          title="No VIP tier yet"
          body="Upgrade to Silver, Gold, or Platinum to unlock VIP benefits."
          action={
            <Button to="/membership/vip">View VIP tiers</Button>
          }
        />
      </Page>
    )
  }

  const current = vipTiers.find((v) => v.id === vip)

  if (!current) {
    return (
      <Page title="My VIP" intro="Your VIP status.">
        <EmptyState
          title="Tier not found"
          body="Your saved VIP tier is no longer available. Choose a new one."
          action={<Button to="/membership/vip">View VIP tiers</Button>}
        />
      </Page>
    )
  }

  return (
    <Page title="My VIP" intro="Your current VIP tier.">
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
        <div className="mt-6">
          <Button to="/membership/vip" variant="secondary">
            Change tier
          </Button>
        </div>
        <p className="mt-6 text-sm text-muted">Simulated billing — no real charges.</p>
      </Card>
    </Page>
  )
}
