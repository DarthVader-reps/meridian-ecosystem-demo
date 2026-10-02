import { useState } from 'react'
import { Badge, Button, Card, Modal } from '../../components/ui'
import { Page } from '../../components/layout'
import { useTrading } from '../../store/trading'
import { useUI } from '../../store/ui'
import managersData from '../../mock/managers.json'

interface Manager {
  id: string
  name: string
  strategy: string
  feePct: number
  performanceFeePct: number
  trackRecord: string
  assets: string
}

const managers = managersData as Manager[]

export default function ManagedAccounts() {
  const { managedApplications, applyManaged } = useTrading()
  const pushToast = useUI((s) => s.pushToast)
  const [pending, setPending] = useState<Manager | null>(null)

  function handleConfirm() {
    if (!pending) return
    applyManaged(pending.id)
    pushToast('Application sent', `Your request for ${pending.name} was recorded as a demo application.`)
    setPending(null)
  }

  return (
    <Page title="Managed accounts" intro="Apply for a simulated managed account. Managers, fees, and track records are illustrative." disclaimer>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {managers.map((m) => {
          const applied = managedApplications.includes(m.id)
          return (
            <Card key={m.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-semibold text-ink dark:text-paper">{m.name}</h2>
                {applied && <Badge tone="accent">Application sent</Badge>}
              </div>
              <p className="mt-1 text-sm text-muted">{m.strategy}</p>
              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-muted">Management fee</dt>
                  <dd className="mt-0.5 font-semibold text-ink dark:text-paper">{m.feePct.toFixed(2)}%</dd>
                </div>
                <div>
                  <dt className="text-muted">Performance fee</dt>
                  <dd className="mt-0.5 font-semibold text-ink dark:text-paper">{m.performanceFeePct.toFixed(0)}%</dd>
                </div>
                <div>
                  <dt className="text-muted">Track record</dt>
                  <dd className="mt-0.5 font-semibold text-ink dark:text-paper">{m.trackRecord} simulated</dd>
                </div>
                <div>
                  <dt className="text-muted">Assets</dt>
                  <dd className="mt-0.5 font-semibold text-ink dark:text-paper">{m.assets}</dd>
                </div>
              </dl>
              <div className="mt-auto pt-5">
                {applied ? (
                  <Button variant="secondary" className="w-full" disabled>
                    Application sent
                  </Button>
                ) : (
                  <Button className="w-full" onClick={() => setPending(m)}>
                    Apply
                  </Button>
                )}
              </div>
            </Card>
          )
        })}
      </div>
      <p className="mt-6 text-sm text-muted">
        Simulated fees: figures shown are illustrative and not charged. Past simulated performance is not a guarantee of future results.
      </p>

      <Modal open={pending !== null} onClose={() => setPending(null)} title="Confirm application">
        {pending && (
          <div className="space-y-4">
            <p className="text-sm text-muted">Review your application before sending.</p>
            <dl className="space-y-2 rounded-xl bg-mist dark:bg-ink p-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Manager</dt>
                <dd className="font-semibold text-ink dark:text-paper">{pending.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Management fee</dt>
                <dd className="font-semibold text-ink dark:text-paper">{pending.feePct.toFixed(2)}% (simulated)</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Performance fee</dt>
                <dd className="font-semibold text-ink dark:text-paper">{pending.performanceFeePct.toFixed(0)}% (simulated)</dd>
              </div>
            </dl>
            <p className="text-xs text-muted">No money moves. This application is fully simulated.</p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setPending(null)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleConfirm}>
                Confirm application
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Page>
  )
}
