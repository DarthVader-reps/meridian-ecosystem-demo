import { supabase } from './supabase'
import { isSupabaseConfigured } from '../config/supabase'

export interface SupabaseProfile {
  id: string
  name: string
  email: string | null
  role: 'user' | 'admin'
  status: 'active' | 'suspended'
  /** True when an admin froze this account's transactions (migration-005). */
  tx_frozen: boolean
  created_at: string
}

export type AdminAccess = 'loading' | 'no-session' | 'not-admin' | 'ready' | 'error'

function requireClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.')
  return supabase
}

/**
 * Determines what the operator can see in the admin Users page:
 *  - no-session: logged out as a user (PIN alone is not enough for real data)
 *  - not-admin: logged in, but their profile role is not 'admin'
 *  - ready: admin session present; RLS will return every profile
 */
export async function getAdminAccess(): Promise<{ access: AdminAccess; email?: string; error?: string }> {
  try {
    const client = requireClient()
    const {
      data: { session },
    } = await client.auth.getSession()
    if (!session) return { access: 'no-session' }
    const { data: me, error } = await client
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
    if (error) return { access: 'error', error: error.message }
    if (me?.role !== 'admin') return { access: 'not-admin', email: session.user.email ?? undefined }
    return { access: 'ready' }
  } catch (e) {
    return { access: 'error', error: e instanceof Error ? e.message : 'Failed to check admin access.' }
  }
}

export async function fetchProfiles(): Promise<{ profiles: SupabaseProfile[]; error: string | null }> {
  try {
    const client = requireClient()
    const { data, error } = await client
      .from('profiles')
      .select('id,name,email,role,status,tx_frozen,created_at')
      .order('created_at', { ascending: false })
    if (error) return { profiles: [], error: error.message }
    // Profiles created before migration-005 lack tx_frozen; default to false.
    const profiles = ((data ?? []) as SupabaseProfile[]).map((p) => ({ ...p, tx_frozen: p.tx_frozen === true }))
    return { profiles, error: null }
  } catch (e) {
    return { profiles: [], error: e instanceof Error ? e.message : 'Failed to load users.' }
  }
}

export async function updateProfileRole(id: string, role: 'user' | 'admin'): Promise<string | null> {
  try {
    const { error } = await requireClient().from('profiles').update({ role }).eq('id', id)
    return error ? error.message : null
  } catch (e) {
    return e instanceof Error ? e.message : 'Failed to update role.'
  }
}

export async function updateProfileStatus(
  id: string,
  status: 'active' | 'suspended',
): Promise<string | null> {
  try {
    const { error } = await requireClient().from('profiles').update({ status }).eq('id', id)
    return error ? error.message : null
  } catch (e) {
    return e instanceof Error ? e.message : 'Failed to update status.'
  }
}

/** Freezes / unfreezes a user's transactions (migration-005). */
export async function setUserTxFrozen(id: string, frozen: boolean): Promise<string | null> {
  try {
    const { error } = await requireClient().from('profiles').update({ tx_frozen: frozen }).eq('id', id)
    return error ? error.message : null
  } catch (e) {
    return e instanceof Error ? e.message : 'Failed to update freeze status.'
  }
}

export interface BalanceAdjustment {
  userId: string
  asset: string
  /** Positive = credit, negative = debit. */
  amount: number
  reason: string
}

/**
 * Credits or debits a user's balance, with a mandatory reason that lands in
 * the ledger as the audit trail. Requires migration-005 (admin policies).
 * Returns an error string, or null on success.
 */
export async function adjustUserBalance({
  userId,
  asset,
  amount,
  reason,
}: BalanceAdjustment): Promise<string | null> {
  try {
    const client = requireClient()
    const cleanAsset = asset.trim().toUpperCase()
    const cleanReason = reason.trim()
    if (!cleanAsset) return 'Choose an asset.'
    if (!Number.isFinite(amount) || amount === 0) return 'Enter a non-zero amount.'
    if (cleanReason.length < 3) return 'A reason is required for the audit trail.'

    const round8 = (n: number) => Math.round(n * 1e8) / 1e8
    const delta = round8(amount)

    const { data: row, error: readError } = await client
      .from('wallet_balances')
      .select('balance')
      .eq('user_id', userId)
      .eq('asset', cleanAsset)
      .maybeSingle()
    if (readError) return readError.message
    const current = Number((row as { balance?: number } | null)?.balance ?? 0)
    const next = round8(current + delta)
    if (next < 0) return `Insufficient ${cleanAsset} balance for this debit (has ${current}).`

    const { error: upsertError } = await client
      .from('wallet_balances')
      .upsert({ user_id: userId, asset: cleanAsset, balance: next }, { onConflict: 'user_id,asset' })
    if (upsertError) return upsertError.message

    const { error: txError } = await client.from('transactions').insert({
      user_id: userId,
      type: delta > 0 ? 'deposit' : 'withdraw',
      asset: cleanAsset,
      amount: delta,
      detail: `Admin ${delta > 0 ? 'credit' : 'debit'}: ${cleanReason}`,
    })
    if (txError) return txError.message
    return null
  } catch (e) {
    return e instanceof Error ? e.message : 'Balance adjustment failed.'
  }
}

// ---------------------------------------------------------------------------
// Platform-wide ledger + dashboard stats (admin only; enforced by RLS)
// ---------------------------------------------------------------------------

export interface SupabaseTransaction {
  id: string
  user_id: string
  type: 'deposit' | 'withdraw' | 'transfer' | 'swap' | 'trade'
  asset: string
  amount: number
  detail: string | null
  created_at: string
  /** Resolved from profiles in code (no FK join available to PostgREST). */
  userLabel: string
}

export function profileLabel(p: Pick<SupabaseProfile, 'name' | 'email'> | undefined): string {
  if (!p) return 'Unknown user'
  return p.name?.trim() || p.email || 'Unknown user'
}

/** Pure helper: attach a display label to every transaction. Exported for tests. */
export function labelTransactions(
  txs: Array<Omit<SupabaseTransaction, 'userLabel'>>,
  profiles: SupabaseProfile[],
): SupabaseTransaction[] {
  const byId = new Map(profiles.map((p) => [p.id, p]))
  return txs.map((t) => ({ ...t, userLabel: profileLabel(byId.get(t.user_id)) }))
}

export interface AdminDashboardStats {
  totalUsers: number
  activeUsers: number
  suspendedUsers: number
  adminCount: number
  signupsLast7d: number
  totalTransactions: number
  recent: SupabaseTransaction[]
  /** Buckets for the last 7 days, oldest first: { day: 'Mon', signups: n }. */
  signupSeries: Array<{ day: string; signups: number }>
  /** Transaction counts by type. */
  txTypeSeries: Array<{ type: string; count: number }>
}

/** Pure helper: compute dashboard stats from fetched rows. Exported for tests. */
export function computeDashboardStats(
  profiles: SupabaseProfile[],
  txs: SupabaseTransaction[],
  now = new Date(),
): AdminDashboardStats {
  const totalUsers = profiles.length
  const activeUsers = profiles.filter((p) => p.status === 'active').length
  const suspendedUsers = profiles.filter((p) => p.status === 'suspended').length
  const adminCount = profiles.filter((p) => p.role === 'admin').length

  const weekAgo = now.getTime() - 7 * 86400000
  const signupsLast7d = profiles.filter((p) => new Date(p.created_at).getTime() >= weekAgo).length

  const signupSeries: Array<{ day: string; signups: number }> = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000)
    const key = d.toISOString().slice(0, 10)
    const signups = profiles.filter((p) => p.created_at.slice(0, 10) === key).length
    signupSeries.push({ day: d.toLocaleDateString(undefined, { weekday: 'short' }), signups })
  }

  const txTypeMap = new Map<string, number>()
  for (const t of txs) txTypeMap.set(t.type, (txTypeMap.get(t.type) ?? 0) + 1)
  const txTypeSeries = [...txTypeMap.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)

  return {
    totalUsers,
    activeUsers,
    suspendedUsers,
    adminCount,
    signupsLast7d,
    totalTransactions: txs.length,
    recent: txs.slice(0, 8),
    signupSeries,
    txTypeSeries,
  }
}

export async function fetchAllTransactions(
  limit = 500,
): Promise<{ transactions: SupabaseTransaction[]; error: string | null }> {
  try {
    const client = requireClient()
    const [{ data: txData, error: txError }, { profiles, error: pError }] = await Promise.all([
      client
        .from('transactions')
        .select('id,user_id,type,asset,amount,detail,created_at')
        .order('created_at', { ascending: false })
        .limit(limit),
      fetchProfiles(),
    ])
    if (txError) return { transactions: [], error: txError.message }
    if (pError) return { transactions: [], error: pError }
    const raw = (txData ?? []) as Array<Omit<SupabaseTransaction, 'userLabel'>>
    return { transactions: labelTransactions(raw, profiles), error: null }
  } catch (e) {
    return { transactions: [], error: e instanceof Error ? e.message : 'Failed to load transactions.' }
  }
}

export async function fetchAdminDashboardStats(): Promise<{
  stats: AdminDashboardStats | null
  error: string | null
}> {
  try {
    const { transactions, error } = await fetchAllTransactions(1000)
    if (error) return { stats: null, error }
    const { profiles, error: pError } = await fetchProfiles()
    if (pError) return { stats: null, error: pError }
    return { stats: computeDashboardStats(profiles, transactions), error: null }
  } catch (e) {
    return { stats: null, error: e instanceof Error ? e.message : 'Failed to load dashboard stats.' }
  }
}
