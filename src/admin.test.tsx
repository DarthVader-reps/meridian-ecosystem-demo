import { describe, it, expect, beforeEach } from 'vitest'
import { useAdmin, ADMIN_PIN } from './store/admin'

// Reset store to initial state before each test
beforeEach(() => {
  useAdmin.setState({
    isAdmin: false,
    users: [
      { id: 'u1', name: 'Test User', email: 'test@example.com', tier: 'Standard', status: 'active', joined: '2026-01-01', balance: 1000 },
    ],
    assets: [{ symbol: 'TST', name: 'Test Asset', price: 100, changePct: 1, type: 'stock', currency: 'USD' }],
    plans: [{ id: 'p1', name: 'Test Plan', minAmount: 100, riskLevel: 'Low', term: 'Flexible', tagline: 'Test', returnRange: [2, 5] }],
    vehicles: [{ id: 'v1', name: 'Test Car', type: 'Sedan', price: 30000, rangeKm: 400, seats: 5, drivetrain: 'RWD', availability: 'In stock' }],
    giveaways: [{ id: 'g1', title: 'Test Draw', prize: '$100', entries: 10, status: 'active', endsIn: '7 days' }],
    activity: [],
    settings: {
      platformName: 'Meridian',
      maintenanceMode: false,
      showEnvBanner: true,
      demoBalance: 100000,
      tradingFeePct: 0.1,
      withdrawalFeeUSD: 5,
      minDepositUSD: 10,
      allowSignups: true,
    },
  })
})

describe('admin auth', () => {
  it('rejects wrong PIN', () => {
    expect(useAdmin.getState().login('0000')).toBe(false)
    expect(useAdmin.getState().isAdmin).toBe(false)
  })

  it('accepts correct PIN and logs activity', () => {
    expect(useAdmin.getState().login(ADMIN_PIN)).toBe(true)
    expect(useAdmin.getState().isAdmin).toBe(true)
    expect(useAdmin.getState().activity[0].action).toBe('Admin login')
  })

  it('logout clears admin session', () => {
    useAdmin.getState().login(ADMIN_PIN)
    useAdmin.getState().logout()
    expect(useAdmin.getState().isAdmin).toBe(false)
  })
})

describe('user management', () => {
  it('suspends and reactivates a user', () => {
    useAdmin.getState().updateUserStatus('u1', 'suspended')
    expect(useAdmin.getState().users[0].status).toBe('suspended')
    useAdmin.getState().updateUserStatus('u1', 'active')
    expect(useAdmin.getState().users[0].status).toBe('active')
  })

  it('changes user tier', () => {
    useAdmin.getState().updateUserTier('u1', 'Elite')
    expect(useAdmin.getState().users[0].tier).toBe('Elite')
  })

  it('logs user actions to activity feed', () => {
    useAdmin.getState().updateUserStatus('u1', 'suspended')
    const actions = useAdmin.getState().activity.map((a) => a.action)
    expect(actions).toContain('User suspended')
  })
})

describe('asset CRUD', () => {
  it('adds a new asset', () => {
    useAdmin.getState().upsertAsset({ symbol: 'NEW', name: 'New Asset', price: 50, changePct: 0, type: 'crypto', currency: 'USD' })
    expect(useAdmin.getState().assets).toHaveLength(2)
    expect(useAdmin.getState().assets[1].symbol).toBe('NEW')
  })

  it('updates an existing asset', () => {
    useAdmin.getState().upsertAsset({ symbol: 'TST', name: 'Updated', price: 200, changePct: 2, type: 'stock', currency: 'USD' })
    expect(useAdmin.getState().assets).toHaveLength(1)
    expect(useAdmin.getState().assets[0].price).toBe(200)
  })

  it('deletes an asset', () => {
    useAdmin.getState().deleteAsset('TST')
    expect(useAdmin.getState().assets).toHaveLength(0)
  })
})

describe('plan CRUD', () => {
  it('adds, updates, and deletes plans', () => {
    useAdmin.getState().upsertPlan({ id: 'p2', name: 'New Plan', minAmount: 500, riskLevel: 'Medium', term: '12 months', tagline: 'New', returnRange: [4, 8] })
    expect(useAdmin.getState().plans).toHaveLength(2)
    useAdmin.getState().upsertPlan({ id: 'p1', name: 'Renamed', minAmount: 100, riskLevel: 'Low', term: 'Flexible', tagline: 'Test', returnRange: [2, 5] })
    expect(useAdmin.getState().plans[0].name).toBe('Renamed')
    useAdmin.getState().deletePlan('p2')
    expect(useAdmin.getState().plans).toHaveLength(1)
  })
})

describe('vehicle CRUD', () => {
  it('adds, updates, and deletes vehicles', () => {
    useAdmin.getState().upsertVehicle({ id: 'v2', name: 'New Car', type: 'SUV', price: 50000, rangeKm: 500, seats: 7, drivetrain: 'AWD', availability: 'In stock' })
    expect(useAdmin.getState().vehicles).toHaveLength(2)
    useAdmin.getState().deleteVehicle('v1')
    expect(useAdmin.getState().vehicles).toHaveLength(1)
    expect(useAdmin.getState().vehicles[0].id).toBe('v2')
  })
})

describe('giveaway management', () => {
  it('creates and deletes giveaways', () => {
    useAdmin.getState().upsertGiveaway({ id: 'g2', title: 'New Draw', prize: '$500', entries: 0, status: 'active', endsIn: '3 days' })
    expect(useAdmin.getState().giveaways).toHaveLength(2)
    useAdmin.getState().deleteGiveaway('g2')
    expect(useAdmin.getState().giveaways).toHaveLength(1)
  })

  it('picks a winner and marks giveaway as past', () => {
    useAdmin.getState().pickWinner('g1')
    const g = useAdmin.getState().giveaways[0]
    expect(g.status).toBe('past')
    expect(g.winner).toBeTruthy()
  })
})

describe('settings', () => {
  it('updates platform settings', () => {
    useAdmin.getState().updateSettings({ maintenanceMode: true, tradingFeePct: 0.25 })
    const s = useAdmin.getState().settings
    expect(s.maintenanceMode).toBe(true)
    expect(s.tradingFeePct).toBe(0.25)
  })

  it('resets demo data to seed', () => {
    useAdmin.getState().deleteAsset('TST')
    useAdmin.getState().resetDemo()
    expect(useAdmin.getState().assets.length).toBeGreaterThan(0)
    expect(useAdmin.getState().activity[0].action).toBe('Demo reset')
  })
})

describe('activity log', () => {
  it('caps at 200 entries', () => {
    for (let i = 0; i < 210; i++) {
      useAdmin.getState().log(`Action ${i}`, 'detail')
    }
    expect(useAdmin.getState().activity.length).toBeLessThanOrEqual(200)
  })
})
