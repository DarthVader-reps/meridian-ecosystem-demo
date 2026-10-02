import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { formatQty, uid } from '../lib/market'
import { useWallet } from './wallet'
import { useNotifications } from './notifications'
import {
  fetchOwnDepositRequests,
  insertDepositRequest,
  updateDepositRequestStatus,
  type ServerDepositStatus,
} from '../lib/depositServer'
import type { DepositAsset } from '../lib/crypto'

export type DepositStatus =
  | 'awaiting'
  | 'confirming'
  | 'pending-clearance'
  | 'cleared'
  | 'rejected'
  | 'expired'
  | 'cancelled'

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
  /** Server row id (migration-006). Null in local-only mode. */
  serverId: string | null
  /** Last status pushed to the server row (avoids redundant writes). */
  serverPushedStatus: ServerDepositStatus | null
}

/**
 * Compressed demo timing for the confirmation simulator.
 * Real networks need minutes-to-hours; here the confirmation leg
 * completes in about a minute so the UX is actually observable.
 */
export const DEPOSIT_DETECT_AFTER_MS = 12_000
export const DEPOSIT_CONFIRM_EVERY_MS = 15_000
export const DEPOSIT_REQUIRED_CONFIRMATIONS = 3
export const DEPOSIT_EXPIRE_AFTER_MS = 15 * 60_000
export const DEPOSIT_TICK_MS = 5_000
const DECISION_POLL_MS = 15_000

export interface AdvanceResult {
  intent: DepositIntent
  becamePendingClearance: boolean
  /** Local-only mode: no server row, so the simulator clears immediately. */
  becameCleared: boolean
  becameExpired: boolean
}

function toServerStatus(s: DepositStatus): ServerDepositStatus | null {
  switch (s) {
    case 'awaiting': return 'awaiting'
    case 'confirming': return 'confirming'
    case 'pending-clearance': return 'pending_clearance'
    case 'expired': return 'expired'
    case 'cancelled': return 'cancelled'
    default: return null // cleared/rejected are decided server-side, never pushed
  }
}

/**
 * Pure state transition for one intent at time `now` (ms epoch).
 * Timestamp-driven so a reload mid-flight resumes correctly.
 * `autoClear` is true only in local-only mode (no server row): the
 * simulator then credits immediately, as before build 10.
 */
export function advanceIntent(d: DepositIntent, now: number, autoClear: boolean): AdvanceResult {
  const same: AdvanceResult = { intent: d, becamePendingClearance: false, becameCleared: false, becameExpired: false }
  if (d.status === 'pending-clearance' || d.status === 'cleared' || d.status === 'rejected' || d.status === 'expired' || d.status === 'cancelled') {
    return same
  }
  const created = new Date(d.createdAt).getTime()

  if (d.status === 'awaiting') {
    if (now - created >= DEPOSIT_EXPIRE_AFTER_MS) {
      return { ...same, intent: { ...d, status: 'expired' }, becameExpired: true }
    }
    if (now - created >= DEPOSIT_DETECT_AFTER_MS) {
      return { ...same, intent: { ...d, status: 'confirming', confirmations: 0 } }
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
    if (autoClear) {
      return { ...same, intent: { ...d, status: 'cleared', confirmations: d.requiredConfirmations }, becameCleared: true }
    }
    return {
      ...same,
      intent: { ...d, status: 'pending-clearance', confirmations: d.requiredConfirmations },
      becamePendingClearance: true,
    }
  }
  if (confirmations !== d.confirmations) {
    return { ...same, intent: { ...d, confirmations } }
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
          serverId: null,
          serverPushedStatus: null,
        }
        set((s) => ({ deposits: [intent, ...s.deposits].slice(0, 100) }))
        // Fire-and-forget: without a server row the intent stays local and
        // the simulator auto-clears (documented fallback).
        void insertDepositRequest({ asset, network, amount, address }).then((serverId) => {
          if (!serverId) {
            console.warn('[deposits] no server row — local fallback (auto-clear on confirm)')
            return
          }
          set((s) => ({
            deposits: s.deposits.map((d) => (d.id === id ? { ...d, serverId } : d)),
          }))
          tickDeposits()
        })
        tickDeposits()
        return id
      },

      cancelDeposit: (id) => {
        const d = useDeposits.getState().deposits.find((x) => x.id === id)
        if (d?.serverId) void updateDepositRequestStatus(d.serverId, 'cancelled')
        set((s) => ({
          deposits: s.deposits.map((x) =>
            x.id === id && (x.status === 'awaiting' || x.status === 'confirming' || x.status === 'pending-clearance')
              ? { ...x, status: 'cancelled' as const }
              : x,
          ),
        }))
      },
    }),
    { name: 'meridian-deposits' },
  ),
)

let lastDecisionPoll = 0

/**
 * Advance all in-flight intents. Called on a 5s interval from the app
 * shell (see App.tsx) and after each createDeposit. Exported for tests.
 */
export function tickDeposits(now: number = Date.now()): void {
  const { deposits } = useDeposits.getState()
  let changed = false
  const cleared: DepositIntent[] = []
  const pendingClearance: DepositIntent[] = []
  const expired: DepositIntent[] = []
  const next = deposits.map((d) => {
    const r = advanceIntent(d, now, !d.serverId)
    let intent = r.intent
    if (intent !== d) changed = true
    if (r.becameCleared) cleared.push(intent)
    if (r.becamePendingClearance) pendingClearance.push(intent)
    if (r.becameExpired) expired.push(intent)
    // Mirror client-driven transitions to the server row.
    const target = toServerStatus(intent.status)
    if (intent.serverId && target && intent.serverPushedStatus !== target) {
      void updateDepositRequestStatus(intent.serverId, target)
      intent = { ...intent, serverPushedStatus: target }
      changed = true
    }
    return intent
  })
  if (changed) useDeposits.setState({ deposits: next })

  for (const d of cleared) {
    // Local-only mode: balance is credited exactly once, at the transition.
    useWallet.getState().deposit(d.asset, d.amount, `Deposit confirmed · ${d.network}`)
    useNotifications.getState().notify({
      title: 'Deposit confirmed',
      body: `${formatQty(d.amount)} ${d.asset} added to your wallet.`,
      kind: 'success',
      link: '/wallet/history',
    })
  }
  for (const d of pendingClearance) {
    useNotifications.getState().notify({
      title: 'Deposit pending review',
      body: `${formatQty(d.amount)} ${d.asset} confirmed on network. It will credit once it's been reviewed.`,
      kind: 'info',
      link: '/wallet/deposit',
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

  if (now - lastDecisionPoll >= DECISION_POLL_MS) {
    lastDecisionPoll = now
    void pollDepositDecisions()
  }
}

/**
 * Pull review decisions (cleared/rejected) for the user's server-backed
 * intents. On cleared, the balance was credited server-side — re-sync the
 * wallet so it appears locally. Exported for tests.
 */
export async function pollDepositDecisions(): Promise<void> {
  const rows = await fetchOwnDepositRequests()
  if (!rows) return
  const byId = new Map(rows.map((r) => [r.id, r.status]))
  const { deposits } = useDeposits.getState()
  let changed = false
  let clearedAny = false
  const next = deposits.map((d) => {
    if (!d.serverId) return d
    const server = byId.get(d.serverId)
    if (server === 'cleared' && d.status !== 'cleared') {
      changed = true
      clearedAny = true
      return { ...d, status: 'cleared' as const }
    }
    if (server === 'rejected' && d.status !== 'rejected') {
      changed = true
      useNotifications.getState().notify({
        title: 'Deposit rejected',
        body: `Your ${formatQty(d.amount)} ${d.asset} deposit was not approved.`,
        kind: 'error',
        link: '/wallet/deposit',
      })
      return { ...d, status: 'rejected' as const }
    }
    return d
  })
  if (changed) useDeposits.setState({ deposits: next })
  if (clearedAny) {
    const synced = await useWallet.getState().syncFromServer().catch(() => false)
    if (synced) {
      const credited = next.filter((d) => d.status === 'cleared')
      const latest = credited[0]
      if (latest) {
        useNotifications.getState().notify({
          title: 'Deposit cleared',
          body: `${formatQty(latest.amount)} ${latest.asset} added to your wallet.`,
          kind: 'success',
          link: '/wallet/history',
        })
      }
    }
  }
}
