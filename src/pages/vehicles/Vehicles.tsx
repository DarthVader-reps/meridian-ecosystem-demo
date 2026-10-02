import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Page } from '../../components/layout'
import { Badge, Button, EmptyState, Field, LoadingState, Select } from '../../components/ui'
import { formatMoney } from '../../lib/market'
import vehiclesData from '../../mock/vehicles.json'

interface Vehicle {
  id: string
  name: string
  type: string
  price: number
  rangeKm: number
  seats: number
  drivetrain: string
  availability: 'In stock' | 'Low stock' | 'Preorder'
  specs: Record<string, string>
}

const vehicles = vehiclesData as Vehicle[]

const availabilityTone = { 'In stock': 'green', 'Low stock': 'amber', Preorder: 'neutral' } as const

const ACCENTS = ['#3b6ef6', '#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']

export function VehicleArt({ accent, className }: { accent: string; className?: string }) {
  return (
    <svg viewBox="0 0 220 100" className={className} role="img" aria-hidden="true">
      <path
        d="M22 68 C22 59 32 57 46 55 L72 50 C84 36 102 30 122 30 C144 30 162 38 174 52 L198 57 C208 59 212 62 212 70 L212 73 C212 77 208 79 204 79 L20 79 C16 79 14 76 14 73 Z"
        fill={accent}
        opacity="0.85"
      />
      <path d="M80 49 C92 37 106 33 122 33 C140 33 155 40 165 52 L80 52 Z" fill="#0f172a" opacity="0.28" />
      <rect x="14" y="74" width="198" height="6" rx="3" fill="#0f172a" opacity="0.12" />
      <circle cx="64" cy="78" r="13" fill="#1f2937" />
      <circle cx="64" cy="78" r="5.5" fill="#9ca3af" />
      <circle cx="158" cy="78" r="13" fill="#1f2937" />
      <circle cx="158" cy="78" r="5.5" fill="#9ca3af" />
    </svg>
  )
}

function useSimulatedLoading() {
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(t)
  }, [])
  return loading
}

export default function VehiclesPage() {
  const loading = useSimulatedLoading()
  const [type, setType] = useState('all')
  const [maxPrice, setMaxPrice] = useState('any')
  const [minRange, setMinRange] = useState('any')
  const [availability, setAvailability] = useState('all')

  const types = useMemo(() => Array.from(new Set(vehicles.map((v) => v.type))), [])

  const filtered = useMemo(
    () =>
      vehicles.filter(
        (v) =>
          (type === 'all' || v.type === type) &&
          (maxPrice === 'any' || v.price <= Number(maxPrice)) &&
          (minRange === 'any' || v.rangeKm >= Number(minRange)) &&
          (availability === 'all' || v.availability === availability),
      ),
    [type, maxPrice, minRange, availability],
  )

  const hasFilters = type !== 'all' || maxPrice !== 'any' || minRange !== 'any' || availability !== 'all'
  const clearFilters = () => {
    setType('all')
    setMaxPrice('any')
    setMinRange('any')
    setAvailability('all')
  }

  return (
    <Page title="Vehicles" intro="A curated inventory of fictional electric vehicles. All models are simulated demo data.">
      {loading ? (
        <LoadingState label="Loading vehicles" />
      ) : (
        <>
          <div className="grid gap-4 rounded-2xl border border-line dark:border-[#2a2a2d] bg-paper dark:bg-ink-soft p-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Type" htmlFor="filter-type">
              <Select id="filter-type" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="all">All types</option>
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Max price" htmlFor="filter-price">
              <Select id="filter-price" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}>
                <option value="any">Any price</option>
                <option value="30000">Up to {formatMoney(30000, 0)}</option>
                <option value="50000">Up to {formatMoney(50000, 0)}</option>
                <option value="70000">Up to {formatMoney(70000, 0)}</option>
              </Select>
            </Field>
            <Field label="Min range" htmlFor="filter-range">
              <Select id="filter-range" value={minRange} onChange={(e) => setMinRange(e.target.value)}>
                <option value="any">Any range</option>
                <option value="400">400 km or more</option>
                <option value="500">500 km or more</option>
              </Select>
            </Field>
            <Field label="Availability" htmlFor="filter-availability">
              <Select id="filter-availability" value={availability} onChange={(e) => setAvailability(e.target.value)}>
                <option value="all">All</option>
                <option value="In stock">In stock</option>
                <option value="Low stock">Low stock</option>
                <option value="Preorder">Preorder</option>
              </Select>
            </Field>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              {filtered.length} of {vehicles.length} vehicles
            </p>
            {hasFilters && (
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No vehicles match"
                body="Try widening your filters to see more of the inventory."
                action={
                  <Button variant="secondary" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                }
              />
            </div>
          ) : (
            <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((v, i) => (
                <li key={v.id}>
                  <Link
                    to={`/vehicles/${v.id}`}
                    className="block h-full rounded-2xl border border-line dark:border-[#2a2a2d] bg-paper dark:bg-ink-soft p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-md"
                  >
                    <div className="flex h-36 items-center justify-center rounded-xl bg-mist dark:bg-ink px-4">
                      <VehicleArt accent={ACCENTS[i % ACCENTS.length]} className="h-28 w-full" />
                    </div>
                    <div className="mt-4 flex items-start justify-between gap-2">
                      <h2 className="text-lg font-semibold text-ink dark:text-paper">{v.name}</h2>
                      <Badge tone="neutral">{v.type}</Badge>
                    </div>
                    <p className="mt-1 text-xl font-semibold text-ink dark:text-paper">{formatMoney(v.price, 0)}</p>
                    <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
                      <div className="flex gap-1.5">
                        <dt>Range</dt>
                        <dd className="font-medium text-ink dark:text-paper">{v.rangeKm} km</dd>
                      </div>
                      <div className="flex gap-1.5">
                        <dt>Seats</dt>
                        <dd className="font-medium text-ink dark:text-paper">{v.seats}</dd>
                      </div>
                    </dl>
                    <div className="mt-3">
                      <Badge tone={availabilityTone[v.availability]}>{v.availability}</Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Page>
  )
}
