import { describe, expect, it } from 'vitest'
import {
  computeDashboardStats,
  labelTransactions,
  profileLabel,
  type SupabaseProfile,
  type SupabaseTransaction,
} from './supabaseAdmin'
import { useAdmin } from '../store/admin'

const NOW = new Date('2026-10-01T12:00:00.000Z')

function profile(over: Partial<SupabaseProfile> & { id: string }): SupabaseProfile {
  return {
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    status: 'active',
    created_at: '2026-09-20T10:00:00.000Z',
    ...over,
  }
}

function tx(over: Partial<SupabaseTransaction> & { id: string; user_id: string }): SupabaseTransaction {
  return {
    type: 'deposit',
    asset: 'USD',
    amount: 100,
    detail: null,
    created_at: '2026-09-30T10:00:00.000Z',
    userLabel: '',
    ...over,
  }
}

describe('profileLabel', () => {
  it('prefers the display name', () => {
    expect(profileLabel({ name: 'Ada', email: 'ada@example.com' })).toBe('Ada')
  })
  it('falls back to email when the name is blank', () => {
    expect(profileLabel({ name: '  ', email: 'ada@example.com' })).toBe('ada@example.com')
  })
  it('returns Unknown user when nothing is known', () => {
    expect(profileLabel(undefined)).toBe('Unknown user')
    expect(profileLabel({ name: '', email: null })).toBe('Unknown user')
  })
})

describe('labelTransactions', () => {
  it('attaches the profile display name to each transaction', () => {
    const profiles = [profile({ id: 'u1', name: 'Ada', email: 'ada@example.com' })]
    const out = labelTransactions([tx({ id: 't1', user_id: 'u1' })], profiles)
    expect(out[0].userLabel).toBe('Ada')
  })
  it('labels unknown users gracefully', () => {
    const out = labelTransactions([tx({ id: 't1', user_id: 'missing' })], [])
    expect(out[0].userLabel).toBe('Unknown user')
  })
})

describe('computeDashboardStats', () => {
  it('counts users, roles, statuses, and recent signups', () => {
    const profiles = [
      profile({ id: 'u1', role: 'admin', created_at: '2026-09-30T08:00:00.000Z' }),
      profile({ id: 'u2', status: 'suspended', created_at: '2026-09-01T08:00:00.000Z' }),
      profile({ id: 'u3', created_at: '2026-09-29T08:00:00.000Z' }),
    ]
    const txs = [tx({ id: 't1', user_id: 'u1' }), tx({ id: 't2', user_id: 'u3', type: 'trade' })]
    const s = computeDashboardStats(profiles, txs, NOW)
    expect(s.totalUsers).toBe(3)
    expect(s.activeUsers).toBe(2)
    expect(s.suspendedUsers).toBe(1)
    expect(s.adminCount).toBe(1)
    expect(s.signupsLast7d).toBe(2)
    expect(s.totalTransactions).toBe(2)
    expect(s.recent).toHaveLength(2)
    expect(s.signupSeries).toHaveLength(7)
    expect(s.signupSeries.reduce((n, b) => n + b.signups, 0)).toBe(2)
  })

  it('builds the transaction-type breakdown sorted by count', () => {
    const profiles = [profile({ id: 'u1' })]
    const txs = [
      tx({ id: 't1', user_id: 'u1', type: 'trade' }),
      tx({ id: 't2', user_id: 'u1', type: 'trade' }),
      tx({ id: 't3', user_id: 'u1', type: 'deposit' }),
    ]
    const s = computeDashboardStats(profiles, txs, NOW)
    expect(s.txTypeSeries).toEqual([
      { type: 'trade', count: 2 },
      { type: 'deposit', count: 1 },
    ])
  })

  it('handles empty data', () => {
    const s = computeDashboardStats([], [], NOW)
    expect(s.totalUsers).toBe(0)
    expect(s.totalTransactions).toBe(0)
    expect(s.recent).toEqual([])
    expect(s.signupSeries).toHaveLength(7)
    expect(s.txTypeSeries).toEqual([])
  })
})

describe('admin store grant()', () => {
  it('grants console access without a PIN', () => {
    useAdmin.setState({ isAdmin: false })
    useAdmin.getState().grant()
    expect(useAdmin.getState().isAdmin).toBe(true)
    useAdmin.getState().logout()
    expect(useAdmin.getState().isAdmin).toBe(false)
  })
})
