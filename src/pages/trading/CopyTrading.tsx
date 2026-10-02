import { useState } from 'react'
import { Badge, Button, Card, Modal } from '../../components/ui'
import { Page } from '../../components/layout'
import { useRequireLogin } from '../../components/useRequireLogin'
import { useTrading } from '../../store/trading'
import { useUI } from '../../store/ui'
import { formatPct } from '../../lib/market'
import { cn } from '../../lib/cn'
import tradersData from '../../mock/traders.json'

interface Trader {
  id: string
  name: string
  strategy: string
  returnPct: number
  winRatePct: number
  riskScore: number
  maxDrawdownPct: number
  copiers: number
  trades: number
}

const traders = tradersData as Trader[]

function riskTone(score: number): 'green' | 'amber' | 'red' {
  if (score <= 3) return 'green'
  if (score <= 6) return 'amber'
  return 'red'
}

export default function CopyTrading() {
  const { copiedTraders, copyTrader, stopCopy } = useTrading()
  const pushToast = useUI((s) => s.pushToast)
  const requireLogin = useRequireLogin()
  const [pending, setPending] = useState<Trader | null>(null)

  function handleCopyClick(t: Trader) {
    if (!requireLogin()) return
    setPending(t)
  }

  function handleConfirmCopy() {
    if (!pending) return
    copyTrader(pending.id)
    pushToast('Copying trader', `You are now copying ${pending.name}. Simulated positions only.`)
    setPending(null)
  }

  function handleStop(t: Trader) {
    stopCopy(t.id)
    pushToast('Stopped copying', `You no longer copy ${t.name}.`)
  }

  return (
    <Page title="Copy trading" intro="Follow simulated traders with simulated funds. Track records shown are illustrative, not predictive." disclaimer>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {traders.map((t) => {
          const active = copiedTraders.includes(t.id)
          return (
            <Card key={t.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-ink dark:text-paper">{t.name}</h2>
                  <p className="mt-1 text-sm text-muted">{t.strategy}</p>
                </div>
                {active && <Badge tone="accent">Copying</Badge>}
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-muted">Simulated return</dt>
                  <dd className={cn('mt-0.5 font-semibold', t.returnPct >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                    {formatPct(t.returnPct)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Win rate</dt>
                  <dd className="mt-0.5 font-semibold text-ink dark:text-paper">{formatPct(t.winRatePct)}</dd>
                </div>
                <div>
                  <dt className="text-muted">Risk score</dt>
                  <dd className="mt-0.5">
                    <Badge tone={riskTone(t.riskScore)}>{t.riskScore} / 10</Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Max drawdown</dt>
                  <dd className="mt-0.5 font-semibold text-red-600 dark:text-red-400">{formatPct(t.maxDrawdownPct)}</dd>
                </div>
                <div>
                  <dt className="text-muted">Copiers</dt>
                  <dd className="mt-0.5 font-semibold text-ink dark:text-paper">{t.copiers.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-muted">Trades</dt>
                  <dd className="mt-0.5 font-semibold text-ink dark:text-paper">{t.trades.toLocaleString()}</dd>
                </div>
              </dl>
              <div className="mt-auto pt-5">
                {active ? (
                  <Button variant="secondary" className="w-full" onClick={() => handleStop(t)}>
                    Stop copying
                  </Button>
                ) : (
                  <Button className="w-full" onClick={() => handleCopyClick(t)}>
                    Copy trader
                  </Button>
                )}
              </div>
            </Card>
          )
        })}
      </div>
      <p className="mt-6 text-sm text-muted">
        Past simulated performance is not a guarantee of future results. All trading here is paper trading.
      </p>

      <Modal open={pending !== null} onClose={() => setPending(null)} title={pending ? `Copy ${pending.name}?` : 'Copy trader'}>
        {pending && (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              You will mirror {pending.name}'s simulated trades ({pending.strategy}) with simulated funds.
              This does not move real markets and you can stop copying at any time.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setPending(null)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleConfirmCopy} className="flex-1">
                Start copying
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Page>
  )
}
