import { useEffect, useState } from 'react'
import { Page } from '../../components/layout'
import { Badge, Button, Card, Field, Input, LoadingState, Modal } from '../../components/ui'
import { usePortfolio } from '../../store/portfolio'
import { useUI } from '../../store/ui'
import { formatMoney } from '../../lib/market'
import plansJson from '../../mock/plans.json'

interface Plan {
  id: string
  name: string
  tagline: string
  minAmount: number
  riskLevel: string
  term: string
  returnRange: [number, number]
  allocation: string[]
  features: string[]
}

const plans = plansJson as unknown as Plan[]

function riskTone(level: string): 'green' | 'amber' | 'red' | 'neutral' {
  if (level === 'Low') return 'green'
  if (level === 'Medium') return 'amber'
  if (level === 'High' || level === 'Very high') return 'red'
  return 'neutral'
}

export default function PlansPage() {
  const [ready, setReady] = useState(false)
  const [active, setActive] = useState<Plan | null>(null)
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [confirmed, setConfirmed] = useState(false)
  const startPlan = usePortfolio((s) => s.startPlan)
  const pushToast = useUI((s) => s.pushToast)

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 500)
    return () => clearTimeout(t)
  }, [])

  const openPlan = (plan: Plan) => {
    setActive(plan)
    setAmount('')
    setError(undefined)
    setConfirmed(false)
  }

  const close = () => setActive(null)

  const confirm = () => {
    if (!active) return
    const n = Number(amount)
    if (amount.trim() === '' || Number.isNaN(n)) {
      setError('Enter an amount in USD.')
      return
    }
    if (n < active.minAmount) {
      setError(`Minimum amount is ${formatMoney(active.minAmount, 0)}.`)
      return
    }
    if (n <= 0) {
      setError('Amount must be greater than zero.')
      return
    }
    startPlan(active.id, n)
    pushToast('Plan started', `${active.name} plan funded with ${formatMoney(n, 0)}.`)
    setConfirmed(true)
  }

  return (
    <Page
      title="Investment plans"
      intro="Simulated portfolio plans with clear minimums, terms, and risk levels."
      disclaimer
    >
      {!ready ? (
        <LoadingState label="Loading plans" />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-xl font-semibold text-ink dark:text-paper">{plan.name}</h2>
                  <p className="mt-1 text-sm text-muted">{plan.tagline}</p>
                </div>
                <Badge tone={riskTone(plan.riskLevel)}>{plan.riskLevel} risk</Badge>
              </div>

              <dl className="mt-4 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Minimum</dt>
                  <dd className="font-medium text-ink dark:text-paper">{formatMoney(plan.minAmount, 0)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Term</dt>
                  <dd className="font-medium text-ink dark:text-paper">{plan.term}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Simulated return range</dt>
                  <dd className="font-medium text-ink dark:text-paper">
                    {plan.returnRange[0]}&ndash;{plan.returnRange[1]}%
                  </dd>
                </div>
              </dl>

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted">Allocation</p>
                <ul className="mt-2 space-y-1">
                  {plan.allocation.map((a) => (
                    <li key={a} className="text-sm text-ink dark:text-paper">
                      {a}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted">Features</p>
                <ul className="mt-2 space-y-1">
                  {plan.features.map((f) => (
                    <li key={f} className="text-sm text-muted">
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 flex-1" />
              <Button onClick={() => openPlan(plan)} className="w-full">
                Start plan
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Modal open={active !== null} onClose={close} title={active ? `Start ${active.name}` : 'Start plan'}>
        {active && !confirmed && (
          <div className="space-y-4">
            <p className="text-sm text-muted">{active.tagline}</p>
            <Field label="Amount (USD)" error={error} htmlFor="plan-amount">
              <Input
                id="plan-amount"
                inputMode="decimal"
                placeholder={formatMoney(active.minAmount, 0)}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Field>
            <p className="text-sm text-muted">Minimum {formatMoney(active.minAmount, 0)} &middot; {active.term} term</p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={close} className="flex-1">
                Cancel
              </Button>
              <Button onClick={confirm} className="flex-1">
                Confirm
              </Button>
            </div>
          </div>
        )}
        {active && confirmed && (
          <div className="space-y-4">
            <p className="text-sm text-ink dark:text-paper">
              {active.name} plan started with {formatMoney(Number(amount), 0)} in simulated funds.
            </p>
            <div className="flex gap-3">
              <Button to="/invest/portfolio" onClick={close} className="flex-1">
                View portfolio
              </Button>
              <Button variant="secondary" onClick={close} className="flex-1">
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Page>
  )
}
