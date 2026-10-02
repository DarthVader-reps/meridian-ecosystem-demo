import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from './ui'
import { useDeposits } from '../store/deposits'
import { seedOrders, useTrading } from '../store/trading'
import { usePortfolio } from '../store/portfolio'
import { useMembership } from '../store/membership'

const DISMISS_KEY = 'meridian-getting-started-dismissed'

interface Step {
  key: string
  title: string
  body: string
  to: string
  cta: string
  done: boolean
}

/**
 * First-run checklist on the dashboard. Steps complete automatically as
 * the user does them; the card hides once everything is done or dismissed.
 */
export default function GettingStarted() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })

  const hasClearedDeposit = useDeposits((s) => s.deposits.some((d) => d.status === 'cleared'))
  const hasTraded = useTrading((s) => s.orders.length > seedOrders.length)
  const hasPlan = usePortfolio((s) => s.plans.length > 1)
  const hasGiveaway = useMembership((s) => s.giveawayEntries.length > 0)

  if (dismissed) return null

  const steps: Step[] = [
    {
      key: 'deposit',
      title: 'Make your first deposit',
      body: 'Add BTC, ETH, or USDT — an admin clears it after network confirmation.',
      to: '/wallet/deposit',
      cta: 'Deposit',
      done: hasClearedDeposit,
    },
    {
      key: 'trade',
      title: 'Place your first paper trade',
      body: 'Try the ticket with zero real risk.',
      to: '/trading/demo',
      cta: 'Trade',
      done: hasTraded,
    },
    {
      key: 'plan',
      title: 'Start an investment plan',
      body: 'Pick a plan that fits your timeline.',
      to: '/invest/plans',
      cta: 'Explore plans',
      done: hasPlan,
    },
    {
      key: 'giveaway',
      title: 'Enter a giveaway',
      body: 'Weekly draws, simulated prizes.',
      to: '/membership/giveaways',
      cta: 'Enter',
      done: hasGiveaway,
    },
  ]

  const doneCount = steps.filter((s) => s.done).length
  if (doneCount === steps.length) return null

  function dismiss() {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* private mode */
    }
  }

  return (
    <Card className="mt-6 border-[var(--color-accent)]/30">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-ink dark:text-paper">Getting started</h3>
          <p className="mt-0.5 text-sm text-muted">
            {doneCount} of {steps.length} complete
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss getting started"
          className="rounded-full p-1 text-muted hover:bg-mist dark:hover:bg-ink-soft"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-mist dark:bg-ink">
        <div
          className="h-full rounded-full bg-[var(--color-accent)] transition-all"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>
      <ul className="mt-4 space-y-3">
        {steps.map((s) => (
          <li key={s.key} className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  s.done ? 'bg-[var(--color-accent)] text-white' : 'border border-line dark:border-[#2a2a2d] text-transparent'
                }`}
              >
                ✓
              </span>
              <div>
                <p className={`text-sm font-medium ${s.done ? 'text-muted line-through' : 'text-ink dark:text-paper'}`}>{s.title}</p>
                {!s.done && <p className="text-xs text-muted">{s.body}</p>}
              </div>
            </div>
            {!s.done && (
              <Link to={s.to} className="shrink-0 text-sm font-medium text-[var(--color-accent)] hover:underline">
                {s.cta} →
              </Link>
            )}
          </li>
        ))}
      </ul>
    </Card>
  )
}
