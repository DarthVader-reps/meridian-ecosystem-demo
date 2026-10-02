import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { formatQty, uid } from '../lib/market'
import { useWallet } from './wallet'
import { useNotifications } from './notifications'
import type { DepositAsset } from '../lib/crypto'

export type DepositStatus = 'awaiting' | 'confirming' | 'paid' | 'expired' | 'cancelled'

export interface DepositIntent {
  id: string
  asset: DepositAsset
  network: string
  amount: number
  address: string
  status: DepositStatus
  createdAt: string
  confirmations: number
  requiredConfirmations: number
}

/**
 * Compressed demo timing for the confirmation simulator.
 * Real networks need minutes-to-hours; here the full lifecycle
 * completes in about a minute so the UX is actually observable.
 */
export const DEPOSIT_DETECT_AFTER_MS = 12_000
export const DEPOSIT_CONFIRM_EVERY_MS = 15_000
export const DEPOSIT_REQUIRED_CONFIRMATIONS = 3
export const DEPOSIT_EXPIRE_AFTER_MS = 15 * 60_000
export const DEPOSIT_TICK_MS = 5_000

export interface AdvanceResult {
  intent: DepositIntent
  becamePaid: boolean
  becameExpired: boolean
}

/**
 * Pure state transition for one intent at time `now` (ms epoch).
 * Timestamp-driven so a reload mid-flight resumes correctly.
 */
export function advanceIntent(d: DepositIntent, now: number): AdvanceResult {
  const same = { intent: d, becamePaid: false, becameExpired: false }
  if (d.status === 'paid' || d.status === 'expired' || d.status === 'cancelled') return same
  const created = new Date(d.createdAt).getTime()

  if (d.status === 'awaiting') {
    if (now - created >= DEPOSIT_EXPIRE_AFTER_MS) {
      return { intent: { ...d, status: 'expired' }, becamePaid: false, becameExpired: true }
    }
    if (now - created >= DEPOSIT_DETECT_AFTER_MS) {
      return { intent: { ...d, status: 'confirming', confirmations: 0 }, becamePaid: false, becameExpired: false }
    }
    return same
  }

  // confirming
  const detectedAt = created + DEPOSIT_DETECT_AFTER_MS
  const confirmations = Math.min(
    d.requiredConfirmations,
    Math.floor((now - detectedAt) / DEPOSIT_CONFIRM_EVERY_MS),
  )
  if (confirmations >= d.requiredConfirmations) {
    return {
      intent: { ...d, status: 'paid', confirmations: d.requiredConfirmations },
      becamePaid: true,
      becameExpired: false,
    }
  }
  if (confirmations !== d.confirmations) {
    return { intent: { ...d, confirmations }, becamePaid: false, becameExpired: false }
  }
  return same
}

interface DepositsState {
  deposits: DepositIntent[]
  createDeposit: (input: { asset: DepositAsset; network: string; amount: number; address: string }) => string
  cancelDeposit: (id: string) => void
}

export const useDeposits = create<DepositsState>()(
  persist(
    (set) => ({
      deposits: [],

      createDeposit: ({ asset, network, amount, address }) => {
        const id = uid('dep')
        const intent: DepositIntent = {
          id,
          asset,
          network,
          amount,
          address,
          status: 'awaiting',
          createdAt: new Date().toISOString(),
          confirmations: 0,
          requiredConfirmations: DEPOSIT_REQUIRED_CONFIRMATIONS,
        }
        set((s) => ({ deposits: [intent, ...s.deposits].slice(0, 100) }))
        tickDeposits()
        return id
      },

      cancelDeposit: (id) =>
        set((s) => ({
          deposits: s.deposits.map((d) =>
            d.id === id && (d.status === 'awaiting' || d.status === 'confirming')
              ? { ...d, status: 'cancelled' as const }
              : d,
          ),
        })),
    }),
    { name: 'meridian-deposits' },
  ),
)

/**
 * Advance all in-flight intents. Called on a 5s interval from the app
 * shell (see App.tsx) and after each createDeposit. Exported for tests.
 */
export function tickDeposits(now: number = Date.now()): void {
  const { deposits } = useDeposits.getState()
  let changed = false
  const paid: DepositIntent[] = []
  const expired: DepositIntent[] = []
  const next = deposits.map((d) => {
    const r = advanceIntent(d, now)
    if (r.intent !== d) changed = true
    if (r.becamePaid) paid.push(r.intent)
    if (r.becameExpired) expired.push(r.intent)
    return r.intent
  })
  if (changed) useDeposits.setState({ deposits: next })

  for (const d of paid) {
    // Balance is credited exactly once, at the paid transition.
    useWallet.getState().deposit(d.asset, d.amount, `Deposit confirmed · ${d.network}`)
    useNotifications.getState().notify({
      title: 'Deposit confirmed',
      body: `${formatQty(d.amount)} ${d.asset} added to your wallet.`,
      kind: 'success',
      link: '/wallet/history',
    })
  }
  for (const d of expired) {
    useNotifications.getState().notify({
      title: 'Deposit address expired',
      body: `Your ${d.asset} deposit was not detected in time. Create a new one to try again.`,
      kind: 'warning',
      link: '/wallet/deposit',
    })
  }
}
