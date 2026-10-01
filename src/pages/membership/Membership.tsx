import { useEffect, useState } from 'react'
import { Page } from '../../components/layout'
import { Badge, Button, Card, LoadingState } from '../../components/ui'
import { useRequireLogin } from '../../components/useRequireLogin'
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

// A tier effectively includes its own benefits plus every lower tier's,
// with the "Everything in …" shorthand expanded so the compare table
// stays consistent (tiers are ordered ascending in tiers.json).
const isInheritedPlaceholder = (b: string) => b.startsWith('Everything in ')

function effectiveBenefits(tierIndex: number): string[] {
  const out: string[] = []
  for (let i = 0; i <= tierIndex; i++) {
    for (const b of tiers[i].benefits) {
      if (!isInheritedPlaceholder(b) && !out.includes(b)) out.push(b)
    }
  }
  return out
}

export default function MembershipPage() {
  const tier = useMembership((s) => s.tier)
  const setTier = useMembership((s) => s.setTier)
  const pushToast = useUI((s) => s.pushToast)
  const requireLogin = useRequireLogin()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(t)
  }, [])

  const choose = (t: Tier) => {
    if (!requireLogin()) return
    setTier(t.id as MemberTier)
    pushToast('Membership updated', `You are now on ${t.name}.`)
  }

  const allBenefits = tiers
    .flatMap((_, i) => effectiveBenefits(i))
    .filter((b, i, arr) => arr.indexOf(b) === i)

  return (
    <Page title="Membership" intro="Pick the plan that fits. Switch tiers any time; billing is simulated.">
      {loading ? (
        <LoadingState label="Loading membership tiers" />
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-3">
            {tiers.map((t) => {
              const current = tier === t.id
              return (
                <Card key={t.id} className="flex flex-col">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold text-ink dark:text-paper">{t.name}</h2>
                    {current && <Badge tone="accent">Current</Badge>}
                  </div>
                  <p className="mt-3">
                    <span className="text-3xl font-semibold tracking-tight text-ink dark:text-paper">
                      {formatMoney(t.price, 0)}
                    </span>{' '}
                    <span className="text-sm text-muted">{t.priceNote}</span>
                  </p>
                  <ul className="mt-4 flex-1 space-y-2 text-sm text-muted">
                    {t.benefits.map((b) => (
                      <li key={b} className="flex gap-2">
                        <span aria-hidden="true" className="text-[var(--color-accent)]">–</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="mt-6 w-full" variant={current ? 'secondary' : 'primary'} disabled={current} onClick={() => choose(t)}>
                    {current ? 'Current plan' : `Choose ${t.name}`}
                  </Button>
                </Card>
              )
            })}
          </div>

          <section className="mt-12" aria-labelledby="compare-heading">
            <h2 id="compare-heading" className="text-xl font-semibold text-ink dark:text-paper">
              Compare plans
            </h2>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-line dark:border-[#2a2a2d]">
              <table className="w-full min-w-[480px] bg-paper dark:bg-ink-soft text-sm">
                <thead>
                  <tr className="border-b border-line dark:border-[#2a2a2d]">
                    <th scope="col" className="px-4 py-3 text-left font-medium text-muted">
                      Benefit
                    </th>
                    {tiers.map((t) => (
                      <th key={t.id} scope="col" className="px-4 py-3 text-center font-semibold text-ink dark:text-paper">
                        {t.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allBenefits.map((b, i) => (
                    <tr key={b} className={i % 2 === 1 ? 'bg-mist/50 dark:bg-ink/50' : undefined}>
                      <td className="px-4 py-2.5 text-ink dark:text-paper">{b}</td>
                      {tiers.map((t, ti) => (
                        <td key={t.id} className="px-4 py-2.5 text-center text-muted">
                          {effectiveBenefits(ti).includes(b) ? 'Yes' : '–'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="mt-8">
            <Button to="/membership/my" variant="secondary">
              View my membership
            </Button>
          </div>
        </>
      )}
    </Page>
  )
}
