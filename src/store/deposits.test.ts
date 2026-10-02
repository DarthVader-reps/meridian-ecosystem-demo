import { beforeEach, describe, expect, it } from 'vitest'
import {
  advanceIntent,
  DEPOSIT_CONFIRM_EVERY_MS,
  DEPOSIT_DETECT_AFTER_MS,
  DEPOSIT_EXPIRE_AFTER_MS,
  DEPOSIT_REQUIRED_CONFIRMATIONS,
  tickDeposits,
  useDeposits,
  type DepositIntent,
} from './deposits'
import { useWallet } from './wallet'
import { useNotifications } from './notifications'

function intent(over: Partial<DepositIntent> = {}): DepositIntent {
  return {
    id: 'dep-test',
    asset: 'BTC',
    network: 'Bitcoin network (simulated)',
    amount: 0.5,
    address: 'bc1qtest',
    status: 'awaiting',
    createdAt: new Date().toISOString(),
    confirmations: 0,
    requiredConfirmations: DEPOSIT_REQUIRED_CONFIRMATIONS,
    ...over,
  }
}

describe('advanceIntent (pure transitions)', () => {
  it('stays awaiting before detection', () => {
    const d = intent()
    const r = advanceIntent(d, Date.now())
    expect(r.intent.status).toBe('awaiting')
    expect(r.becamePaid).toBe(false)
  })

  it('moves awaiting → confirming after the detection window', () => {
    const d = intent({ createdAt: new Date(Date.now() - DEPOSIT_DETECT_AFTER_MS - 1000).toISOString() })
    const r = advanceIntent(d, Date.now())
    expect(r.intent.status).toBe('confirming')
    expect(r.intent.confirmations).toBe(0)
  })

  it('counts confirmations over time and pays at the required number', () => {
    const created = Date.now() - DEPOSIT_DETECT_AFTER_MS - DEPOSIT_CONFIRM_EVERY_MS * 2 - 1000
    const d = intent({ status: 'confirming', createdAt: new Date(created).toISOString() })
    const r = advanceIntent(d, Date.now())
    expect(r.intent.confirmations).toBe(2)
    expect(r.intent.status).toBe('confirming')

    const later = created + DEPOSIT_DETECT_AFTER_MS + DEPOSIT_CONFIRM_EVERY_MS * DEPOSIT_REQUIRED_CONFIRMATIONS + 1000
    const r2 = advanceIntent({ ...r.intent }, later)
    expect(r2.intent.status).toBe('paid')
    expect(r2.becamePaid).toBe(true)
  })

  it('expires an awaiting intent past the expiry window', () => {
    const d = intent({ createdAt: new Date(Date.now() - DEPOSIT_EXPIRE_AFTER_MS - 1000).toISOString() })
    const r = advanceIntent(d, Date.now())
    expect(r.intent.status).toBe('expired')
    expect(r.becameExpired).toBe(true)
  })

  it('leaves terminal states alone', () => {
    for (const status of ['paid', 'expired', 'cancelled'] as const) {
      const d = intent({ status, createdAt: new Date(Date.now() - 10 * DEPOSIT_EXPIRE_AFTER_MS).toISOString() })
      const r = advanceIntent(d, Date.now())
      expect(r.intent).toBe(d)
    }
  })
})

describe('tickDeposits (store integration)', () => {
  beforeEach(() => {
    useDeposits.setState({ deposits: [] })
    useNotifications.setState({ notifications: [] })
    useWallet.getState().reset()
  })

  it('credits the wallet and notifies exactly once when a deposit pays', () => {
    const created = Date.now() - DEPOSIT_DETECT_AFTER_MS - DEPOSIT_CONFIRM_EVERY_MS * DEPOSIT_REQUIRED_CONFIRMATIONS - 1000
    useDeposits.setState({
      deposits: [intent({ id: 'dep-1', status: 'confirming', createdAt: new Date(created).toISOString() })],
    })
    const before = useWallet.getState().balances.BTC ?? 0

    tickDeposits(Date.now())

    const d = useDeposits.getState().deposits[0]
    expect(d.status).toBe('paid')
    expect(useWallet.getState().balances.BTC ?? 0).toBeCloseTo(before + 0.5, 8)

    const notes = useNotifications.getState().notifications
    expect(notes.some((n) => n.title === 'Deposit confirmed')).toBe(true)

    // A second tick must not double-credit
    tickDeposits(Date.now() + 60_000)
    expect(useWallet.getState().balances.BTC ?? 0).toBeCloseTo(before + 0.5, 8)
    expect(useNotifications.getState().notifications.filter((n) => n.title === 'Deposit confirmed')).toHaveLength(1)
  })

  it('notifies when a deposit expires', () => {
    useDeposits.setState({
      deposits: [intent({ id: 'dep-2', createdAt: new Date(Date.now() - DEPOSIT_EXPIRE_AFTER_MS - 1000).toISOString() })],
    })
    tickDeposits(Date.now())
    expect(useDeposits.getState().deposits[0].status).toBe('expired')
    expect(useNotifications.getState().notifications.some((n) => n.title === 'Deposit address expired')).toBe(true)
  })

  it('cancelDeposit only cancels in-flight intents', () => {
    useDeposits.setState({
      deposits: [
        intent({ id: 'dep-a', status: 'awaiting' }),
        intent({ id: 'dep-b', status: 'paid' }),
      ],
    })
    useDeposits.getState().cancelDeposit('dep-a')
    useDeposits.getState().cancelDeposit('dep-b')
    const byId = Object.fromEntries(useDeposits.getState().deposits.map((d) => [d.id, d.status]))
    expect(byId['dep-a']).toBe('cancelled')
    expect(byId['dep-b']).toBe('paid')
  })
})
