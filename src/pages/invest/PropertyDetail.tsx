import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Page } from '../../components/layout'
import { Badge, Button, Card, ErrorState, Field, Input, LoadingState, Stat } from '../../components/ui'
import { useWallet } from '../../store/wallet'
import { useUI } from '../../store/ui'
import { formatMoney } from '../../lib/market'
import propertiesJson from '../../mock/properties.json'

interface Property {
  id: string
  name: string
  location: string
  type: string
  price: number
  fractionPrice: number
  yieldPct: number
  fundedPct: number
  bedrooms: number
  area: string
  description: string
}

const properties = propertiesJson as unknown as Property[]

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const property = useMemo(() => properties.find((p) => p.id === id), [id])

  const [ready, setReady] = useState(false)
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [submitted, setSubmitted] = useState(false)

  const balances = useWallet((s) => s.balances)
  const withdraw = useWallet((s) => s.withdraw)
  const pushToast = useUI((s) => s.pushToast)

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 500)
    return () => clearTimeout(t)
  }, [])

  if (!ready) {
    return (
      <Page title="Property detail" intro="Loading simulated property." disclaimer>
        <LoadingState label="Loading property" />
      </Page>
    )
  }

  if (!property) {
    return (
      <Page title="Property not found" intro="This simulated property does not exist." disclaimer>
        <ErrorState
          title="Unknown property"
          body="No simulated property matches this listing. It may have been removed."
          onRetry={() => navigate('/invest/real-estate')}
        />
      </Page>
    )
  }

  const usdBalance = balances['USD'] ?? 0

  const invest = () => {
    const n = Number(amount)
    if (amount.trim() === '' || Number.isNaN(n)) {
      setError('Enter an amount in USD.')
      return
    }
    if (n < property.fractionPrice) {
      setError(`Minimum investment is ${formatMoney(property.fractionPrice, 0)} per fraction.`)
      return
    }
    if (n > usdBalance) {
      setError(`Insufficient USD balance. Available: ${formatMoney(usdBalance, 0)}.`)
      return
    }
    if (!withdraw('USD', n, `Fractional investment in ${property.name}`)) {
      setError('Could not complete the investment.')
      return
    }
    pushToast('Investment submitted', `${formatMoney(n, 0)} allocated to ${property.name} in simulated funds.`)
    setSubmitted(true)
  }

  return (
    <Page title={property.name} intro={`${property.location} · ${property.type} · Simulated listing`} disclaimer>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div
              aria-label={`Map placeholder for ${property.name}`}
              role="img"
              className="flex h-56 items-center justify-center overflow-hidden rounded-xl border border-line dark:border-[#2a2a2d] bg-mist dark:bg-ink"
            >
              <svg width="100%" height="100%" aria-hidden="true" className="h-full w-full">
                <defs>
                  <pattern id="map-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                    <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="1" className="text-line" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#map-grid)" />
                <circle cx="50%" cy="50%" r="10" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--color-accent)]" />
                <circle cx="50%" cy="50%" r="26" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-[var(--color-accent)] opacity-50" />
              </svg>
            </div>
            <p className="mt-2 text-center text-xs text-muted">Map placeholder</p>

            <div className="mt-6">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-xl font-semibold text-ink dark:text-paper">{property.name}</h2>
                  <p className="mt-1 text-sm text-muted">{property.location}</p>
                </div>
                <Badge tone="neutral">{property.type}</Badge>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted">{property.description}</p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Price" value={formatMoney(property.price, 0)} />
              <Stat label="Simulated yield" value={`${property.yieldPct.toFixed(1)}%`} />
              <Stat label="Bedrooms" value={property.bedrooms > 0 ? String(property.bedrooms) : '—'} />
              <Stat label="Area" value={property.area} />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <p className="text-sm font-semibold text-ink dark:text-paper">Funding round</p>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-muted">Funded</span>
              <span className="font-medium text-ink dark:text-paper">{property.fundedPct}%</span>
            </div>
            <div
              className="mt-1.5 h-2 overflow-hidden rounded-full bg-mist dark:bg-[#2a2a2d]"
              role="progressbar"
              aria-valuenow={property.fundedPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${property.name} funded`}
            >
              <div className="h-2 rounded-full bg-[var(--color-accent)]" style={{ width: `${property.fundedPct}%` }} />
            </div>
          </Card>

          <Card>
            {!submitted ? (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-ink dark:text-paper">Invest in fractions</p>
                <Field label="Amount (USD)" error={error} htmlFor="fraction-amount">
                  <Input
                    id="fraction-amount"
                    inputMode="decimal"
                    placeholder={formatMoney(property.fractionPrice, 0)}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </Field>
                <p className="text-sm text-muted">
                  Minimum {formatMoney(property.fractionPrice, 0)} &middot; USD balance {formatMoney(usdBalance, 0)}
                </p>
                <Button onClick={invest} className="w-full">
                  Invest now
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-ink dark:text-paper">
                  {formatMoney(Number(amount), 0)} allocated to {property.name} in simulated funds — no real transaction is recorded.
                </p>
                <Button to="/invest/portfolio" className="w-full">
                  View portfolio
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </Page>
  )
}
