import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Page } from '../../components/layout'
import { Badge, Card, EmptyState, Input, LoadingState, Select } from '../../components/ui'
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

export default function RealEstatePage() {
  const [ready, setReady] = useState(false)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 500)
    return () => clearTimeout(t)
  }, [])

  const types = useMemo(() => Array.from(new Set(properties.map((p) => p.type))).sort(), [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return properties.filter((p) => {
      const matchesQuery =
        q === '' || p.name.toLowerCase().includes(q) || p.location.toLowerCase().includes(q)
      const matchesType = typeFilter === 'all' || p.type === typeFilter
      return matchesQuery && matchesType
    })
  }, [query, typeFilter])

  return (
    <Page
      title="Real estate"
      intro="Fractional property investing with simulated funding rounds and yields."
      disclaimer
    >
      {!ready ? (
        <LoadingState label="Loading properties" />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <Input
                type="search"
                aria-label="Search properties"
                placeholder="Search by name or location"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="sm:w-56">
              <Select aria-label="Filter by property type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">All types</option>
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {results.length === 0 ? (
            <EmptyState
              title="No properties found"
              body="No simulated properties match your search. Try a different name, location, or type."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((p) => (
                <Link key={p.id} to={`/invest/real-estate/${p.id}`} aria-label={`View ${p.name}`}>
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-lg font-semibold text-ink dark:text-paper">{p.name}</h2>
                        <p className="mt-0.5 text-sm text-muted">{p.location}</p>
                      </div>
                      <Badge tone="neutral">{p.type}</Badge>
                    </div>

                    <dl className="mt-4 space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted">Price</dt>
                        <dd className="font-medium text-ink dark:text-paper">{formatMoney(p.price, 0)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted">Simulated yield</dt>
                        <dd className="font-medium text-ink dark:text-paper">{p.yieldPct.toFixed(1)}%</dd>
                      </div>
                    </dl>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-muted">
                        <span>Funded</span>
                        <span>{p.fundedPct}%</span>
                      </div>
                      <div
                        className="mt-1.5 h-2 overflow-hidden rounded-full bg-mist dark:bg-[#2a2a2d]"
                        role="progressbar"
                        aria-valuenow={p.fundedPct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${p.name} funded`}
                      >
                        <div className="h-2 rounded-full bg-[var(--color-accent)]" style={{ width: `${p.fundedPct}%` }} />
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-muted">
                      From {formatMoney(p.fractionPrice, 0)} per fraction
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </Page>
  )
}
