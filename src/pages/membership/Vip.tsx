import { useEffect, useState } from 'react'
import { Page } from '../../components/layout'
import { Badge, Button, Card, LoadingState, Modal } from '../../components/ui'
import { useMembership, type VipTier } from '../../store/membership'
import { useUI } from '../../store/ui'
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

export default function VipPage() {
  const vip = useMembership((s) => s.vip)
  const setVip = useMembership((s) => s.setVip)
  const pushToast = useUI((s) => s.pushToast)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState<Vip | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(t)
  }, [])

  const confirmUpgrade = () => {
    if (!pending) return
    setVip(pending.id as VipTier)
    pushToast('VIP updated', `You are now ${pending.name}.`)
    setPending(null)
  }

  return (
    <Page title="VIP" intro="Concierge-style tiers for high-volume demo accounts. Billing is simulated.">
      {loading ? (
        <LoadingState label="Loading VIP tiers" />
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-3">
            {vipTiers.map((v) => {
              const current = vip === v.id
              return (
                <Card key={v.id} className="flex flex-col">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold text-ink dark:text-paper">{v.name}</h2>
                    {current && <Badge tone="accent">Current</Badge>}
                  </div>
                  <p className="mt-3">
                    <span className="text-3xl font-semibold tracking-tight text-ink dark:text-paper">
                      {formatMoney(v.price, 0)}
                    </span>{' '}
                    <span className="text-sm text-muted">{v.priceNote}</span>
                  </p>
                  <ul className="mt-4 flex-1 space-y-2 text-sm text-muted">
                    {v.benefits.map((b) => (
                      <li key={b} className="flex gap-2">
                        <span aria-hidden="true" className="text-[var(--color-accent)]">–</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-6 w-full"
                    variant={current ? 'secondary' : 'primary'}
                    disabled={current}
                    onClick={() => setPending(v)}
                  >
                    {current ? 'Current tier' : 'Upgrade'}
                  </Button>
                </Card>
              )
            })}
          </div>

          <div className="mt-8">
            <Button to="/membership/vip/my" variant="secondary">
              View my VIP
            </Button>
          </div>
        </>
      )}

      <Modal open={pending !== null} onClose={() => setPending(null)} title={pending ? `Upgrade to ${pending.name}` : 'Upgrade'}>
        {pending && (
          <>
            <p className="text-sm text-muted">
              {formatMoney(pending.price, 0)} {pending.priceNote}. This change is simulated and takes no payment.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted">
              {pending.benefits.map((b) => (
                <li key={b} className="flex gap-2">
                  <span aria-hidden="true" className="text-[var(--color-accent)]">–</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setPending(null)}>
                Cancel
              </Button>
              <Button onClick={confirmUpgrade}>Confirm</Button>
            </div>
          </>
        )}
      </Modal>
    </Page>
  )
}
