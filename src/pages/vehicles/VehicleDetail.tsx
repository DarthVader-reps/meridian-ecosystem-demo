import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Page } from '../../components/layout'
import { Badge, Button, ErrorState, Modal, Stat } from '../../components/ui'
import { useUI } from '../../store/ui'
import { formatMoney } from '../../lib/market'
import vehiclesData from '../../mock/vehicles.json'
import { VehicleArt } from './Vehicles'

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

const GALLERY_TONES = ['bg-mist dark:bg-ink', 'bg-[#e8eefc] dark:bg-[#1b2a5c]', 'bg-[#f3f4f6] dark:bg-[#2a2a2d]']

export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>()
  const pushToast = useUI((s) => s.pushToast)
  const [reserveOpen, setReserveOpen] = useState(false)

  const vehicle = vehicles.find((v) => v.id === id)

  if (!vehicle) {
    return (
      <Page title="Vehicle not found">
        <ErrorState
          title="Vehicle not found"
          body="This vehicle does not exist in the inventory."
          onRetry={undefined}
        />
        <div className="mt-4 flex justify-center">
          <Button to="/vehicles" variant="secondary">
            Back to vehicles
          </Button>
        </div>
      </Page>
    )
  }

  const related = vehicles.filter((v) => v.type === vehicle.type && v.id !== vehicle.id).slice(0, 3)

  const specRows: [string, string][] = [
    ['Range', `${vehicle.rangeKm} km`],
    ['Seats', String(vehicle.seats)],
    ['Drivetrain', vehicle.drivetrain],
    ...Object.entries(vehicle.specs),
  ]

  const confirmReservation = () => {
    setReserveOpen(false)
    pushToast('Reservation noted (simulated)', `Your reservation for the ${vehicle.name} was recorded.`)
  }

  return (
    <Page title={vehicle.name}>
      <Link to="/vehicles" className="text-sm text-muted hover:text-ink dark:hover:text-paper">
        ← Back to vehicles
      </Link>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {GALLERY_TONES.map((tone, i) => (
          <div key={i} className={`flex h-40 items-center justify-center rounded-2xl ${tone} px-4`}>
            <VehicleArt accent="#3b6ef6" className="h-32 w-full" />
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Badge tone="neutral">{vehicle.type}</Badge>
        <Badge tone={availabilityTone[vehicle.availability]}>{vehicle.availability}</Badge>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="text-lg font-semibold text-ink dark:text-paper">Specifications</h2>
          <table className="mt-3 w-full overflow-hidden rounded-2xl border border-line dark:border-[#2a2a2d] text-sm">
            <tbody>
              {specRows.map(([label, value], i) => (
                <tr key={label} className={i % 2 === 1 ? 'bg-mist/50 dark:bg-ink/50' : 'bg-paper dark:bg-ink-soft'}>
                  <th scope="row" className="px-4 py-3 text-left font-medium text-muted">
                    {label}
                  </th>
                  <td className="px-4 py-3 text-right font-medium text-ink dark:text-paper">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="h-fit rounded-2xl border border-line dark:border-[#2a2a2d] bg-paper dark:bg-ink-soft p-6">
          <Stat label="Price" value={formatMoney(vehicle.price, 0)} sub={<span className="text-muted">{vehicle.availability}</span>} />
          <Button className="mt-5 w-full" onClick={() => setReserveOpen(true)}>
            Reserve
          </Button>
          <p className="mt-3 text-xs text-muted">Simulated reservation. No payment is taken.</p>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-12" aria-labelledby="related-heading">
          <h2 id="related-heading" className="text-xl font-semibold text-ink dark:text-paper">
            Related {vehicle.type.toLowerCase()}s
          </h2>
          <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <li key={r.id}>
                <Link
                  to={`/vehicles/${r.id}`}
                  className="block rounded-2xl border border-line dark:border-[#2a2a2d] bg-paper dark:bg-ink-soft p-5 transition-shadow hover:shadow-md"
                >
                  <div className="flex h-28 items-center justify-center rounded-xl bg-mist dark:bg-ink px-4">
                    <VehicleArt accent="#0ea5e9" className="h-24 w-full" />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-ink dark:text-paper">{r.name}</h3>
                    <Badge tone="neutral">{r.type}</Badge>
                  </div>
                  <p className="mt-1 font-semibold text-ink dark:text-paper">{formatMoney(r.price, 0)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Modal open={reserveOpen} onClose={() => setReserveOpen(false)} title="Confirm reservation">
        <p className="text-sm text-muted">
          Reserve the <span className="font-medium text-ink dark:text-paper">{vehicle.name}</span> for{' '}
          <span className="font-medium text-ink dark:text-paper">{formatMoney(vehicle.price, 0)}</span>. This is simulated and
          takes no payment.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setReserveOpen(false)}>
            Cancel
          </Button>
          <Button onClick={confirmReservation}>Confirm</Button>
        </div>
      </Modal>
    </Page>
  )
}
