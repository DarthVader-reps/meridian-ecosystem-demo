import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  advanceIntent,
  DEPOSIT_CONFIRM_EVERY_MS,
  DEPOSIT_DETECT_AFTER_MS,
  DEPOSIT_EXPIRE_AFTER_MS,
  DEPOSIT_REQUIRED_CONFIRMATIONS,
  pollDepositDecisions,
  tickDeposits,
  useDeposits,
  type DepositIntent,
} from './deposits'
import { useWallet } from './wallet'
import { useNotifications } from './notifications'
import * as depositServer from '../lib/depositServer'

vi.mock('../lib/depositServer', () => ({
  insertDepositRequest: vi.fn(async () => null),
  updateDepositRequestStatus: vi.fn(async () => {}),
  fetchOwnDepositRequests: vi.fn(async () => null),
  fetchAllDepositRequests: vi.fn(async () => ({ rows: [], error: null })),
  clearDepositRequest: vi.fn(async () => null),
  rejectDepositRequest: vi.fn(async () => null),
}))

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
    serverId: null,
    serverPushedStatus: null,
    ...over,
  }
}

describe('advanceIntent (pure transitions)', () => {
  it('stays awaiting before detection', () => {
    const d = intent()
    const r = advanceIntent(d, Date.now(), false)
    expect(r.intent.status).toBe('awaiting')
    expect(r.becamePendingClearance).toBe(false)
    expect(r.becameCleared).toBe(false)
  })

  it('moves awaiting → confirming after the detection window', () => {
    const d = intent({ createdAt: new Date(Date.now() - DEPOSIT_DETECT_AFTER_MS - 1000).toISOString() })
    const r = advanceIntent(d, Date.now(), false)
    expect(r.intent.status).toBe('confirming')
    expect(r.intent.confirmations).toBe(0)
  })

  it('moves confirming → pending-clearance at the required confirmations (server mode)', () => {
    const created = Date.now() - DEPOSIT_DETECT_AFTER_MS - DEPOSIT_CONFIRM_EVERY_MS * DEPOSIT_REQUIRED_CONFIRMATIONS - 1000
    const d = intent({ status: 'confirming', serverId: 'srv-1', createdAt: new Date(created).toISOString() })
    const r = advanceIntent(d, Date.now(), false)
    expect(r.intent.status).toBe('pending-clearance')
    expect(r.becamePendingClearance).toBe(true)
    expect(r.becameCleared).toBe(false)
  })

  it('moves confirming → cleared at the required confirmations (local fallback)', () => {
    const created = Date.now() - DEPOSIT_DETECT_AFTER_MS - DEPOSIT_CONFIRM_EVERY_MS * DEPOSIT_REQUIRED_CONFIRMATIONS - 1000
    const d = intent({ status: 'confirming', createdAt: new Date(created).toISOString() })
    const r = advanceIntent(d, Date.now(), true)
    expect(r.intent.status).toBe('cleared')
    expect(r.becameCleared).toBe(true)
  })

  it('expires an awaiting intent past the expiry window', () => {
    const d = intent({ createdAt: new Date(Date.now() - DEPOSIT_EXPIRE_AFTER_MS - 1000).toISOString() })
    const r = advanceIntent(d, Date.now(), false)
    expect(r.intent.status).toBe('expired')
    expect(r.becameExpired).toBe(true)
  })

  it('leaves terminal states alone', () => {
    for (const status of ['pending-clearance', 'cleared', 'rejected', 'expired', 'cancelled'] as const) {
      const d = intent({ status, createdAt: new Date(Date.now() - 10 * DEPOSIT_EXPIRE_AFTER_MS).toISOString() })
      const r = advanceIntent(d, Date.now(), false)
      expect(r.intent).toBe(d)
    }
  })
})

describe('tickDeposits (store integration)', () => {
  beforeEach(() => {
    useDeposits.setState({ deposits: [] })
    useNotifications.setState({ notifications: [] })
    useWallet.getState().reset()
    vi.mocked(depositServer.fetchOwnDepositRequests).mockResolvedValue(null)
  })

  it('local mode: credits the wallet exactly once when a deposit clears', () => {
    const created = Date.now() - DEPOSIT_DETECT_AFTER_MS - DEPOSIT_CONFIRM_EVERY_MS * DEPOSIT_REQUIRED_CONFIRMATIONS - 1000
    useDeposits.setState({
      deposits: [intent({ id: 'dep-1', status: 'confirming', createdAt: new Date(created).toISOString() })],
    })

    tickDeposits(Date.now())

    const d = useDeposits.getState().deposits[0]
    expect(d.status).toBe('cleared')
    expect(useWallet.getState().balances.BTC ?? 0).toBeCloseTo(0.5, 8)

    const notes = useNotifications.getState().notifications
    expect(notes.some((n) => n.title === 'Deposit confirmed')).toBe(true)

    // A second tick must not double-credit
    tickDeposits(Date.now() + 60_000)
    expect(useWallet.getState().balances.BTC ?? 0).toBeCloseTo(0.5, 8)
    expect(useNotifications.getState().notifications.filter((n) => n.title === 'Deposit confirmed')).toHaveLength(1)
  })

  it('server mode: holds at pending-clearance without crediting', () => {
    const created = Date.now() - DEPOSIT_DETECT_AFTER_MS - DEPOSIT_CONFIRM_EVERY_MS * DEPOSIT_REQUIRED_CONFIRMATIONS - 1000
    useDeposits.setState({
      deposits: [intent({ id: 'dep-2', serverId: 'srv-2', status: 'confirming', createdAt: new Date(created).toISOString() })],
    })

    tickDeposits(Date.now())

    const d = useDeposits.getState().deposits[0]
    expect(d.status).toBe('pending-clearance')
    expect(useWallet.getState().balances.BTC ?? 0).toBe(0)
    expect(useNotifications.getState().notifications.some((n) => n.title === 'Deposit awaiting admin clearance')).toBe(true)
    expect(depositServer.updateDepositRequestStatus).toHaveBeenCalledWith('srv-2', 'pending_clearance')
  })

  it('notifies when a deposit expires', () => {
    useDeposits.setState({
      deposits: [intent({ id: 'dep-3', createdAt: new Date(Date.now() - DEPOSIT_EXPIRE_AFTER_MS - 1000).toISOString() })],
    })
    tickDeposits(Date.now())
    expect(useDeposits.getState().deposits[0].status).toBe('expired')
    expect(useNotifications.getState().notifications.some((n) => n.title === 'Deposit address expired')).toBe(true)
  })

  it('cancelDeposit only cancels in-flight intents', () => {
    useDeposits.setState({
      deposits: [
        intent({ id: 'dep-a', status: 'awaiting' }),
        intent({ id: 'dep-b', status: 'cleared' }),
      ],
    })
    useDeposits.getState().cancelDeposit('dep-a')
    useDeposits.getState().cancelDeposit('dep-b')
    const byId = Object.fromEntries(useDeposits.getState().deposits.map((d) => [d.id, d.status]))
    expect(byId['dep-a']).toBe('cancelled')
    expect(byId['dep-b']).toBe('cleared')
  })

  it('new sign-ups start at zero balances', () => {
    useWallet.getState().reset()
    expect(useWallet.getState().balances).toEqual({})
    expect(useWallet.getState().transactions).toEqual([])
  })
})

describe('pollDepositDecisions', () => {
  beforeEach(() => {
    useDeposits.setState({ deposits: [] })
    useNotifications.setState({ notifications: [] })
    useWallet.getState().reset()
  })

  it('marks cleared when the server cleared the request', async () => {
    useDeposits.setState({
      deposits: [intent({ id: 'dep-4', serverId: 'srv-4', status: 'pending-clearance' })],
    })
    vi.mocked(depositServer.fetchOwnDepositRequests).mockResolvedValue([
      {
        id: 'srv-4', user_id: 'u1', asset: 'BTC', network: 'Bitcoin network (simulated)',
        amount: 0.5, address: 'bc1qtest', status: 'cleared', created_at: new Date().toISOString(), decided_at: new Date().toISOString(),
      },
    ])
    await pollDepositDecisions()
    expect(useDeposits.getState().deposits[0].status).toBe('cleared')
  })

  it('marks rejected and notifies when the server rejected the request', async () => {
    useDeposits.setState({
      deposits: [intent({ id: 'dep-5', serverId: 'srv-5', status: 'pending-clearance' })],
    })
    vi.mocked(depositServer.fetchOwnDepositRequests).mockResolvedValue([
      {
        id: 'srv-5', user_id: 'u1', asset: 'BTC', network: 'Bitcoin network (simulated)',
        amount: 0.5, address: 'bc1qtest', status: 'rejected', created_at: new Date().toISOString(), decided_at: new Date().toISOString(),
      },
    ])
    await pollDepositDecisions()
    expect(useDeposits.getState().deposits[0].status).toBe('rejected')
    expect(useNotifications.getState().notifications.some((n) => n.title === 'Deposit rejected')).toBe(true)
    expect(useWallet.getState().balances.BTC ?? 0).toBe(0)
  })
})
