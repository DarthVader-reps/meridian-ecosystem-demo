import { supabase } from './supabase'
import { isSupabaseConfigured } from '../config/supabase'

/**
 * Server-side wallet I/O. Balances and the transaction ledger live in Supabase
 * (wallet_balances / transactions tables) so the admin console can credit,
 * debit and freeze them. When Supabase is not configured the wallet stays
 * local-only and every function here becomes a no-op returning null.
 */

export interface ServerTxInput {
  type: 'deposit' | 'withdraw' | 'transfer' | 'swap' | 'trade'
  asset: string
  amount: number
  detail?: string
}

export interface LocalTx {
  id: string
  type: ServerTxInput['type']
  asset: string
  amount: number
  detail?: string
  date: string
}

export interface ServerWalletSnapshot {
  balances: Record<string, number>
  transactions: LocalTx[]
  frozen: boolean
}

let serverUserId: string | null = null

/** Called by the auth store on sign-in/sign-up/sign-out. */
export function setServerWalletUser(id: string | null): void {
  serverUserId = id
}

/** The user id for server wallet I/O, or null when the wallet is local-only. */
export function serverWalletUser(): string | null {
  return isSupabaseConfigured && supabase && serverUserId ? serverUserId : null
}

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

/**
 * Loads balances, recent ledger entries and the freeze flag for the current
 * user. New users start at zero: there are no opening balances — wallets are
 * funded through deposits, which require admin clearance (build 10).
 * Returns null when the wallet is local-only.
 */
export async function loadServerWallet(): Promise<ServerWalletSnapshot | null> {
  const client = requireClient()
  const userId = serverWalletUser()
  if (!userId) return null

  // The freeze flag is best-effort: profiles from before migration-005 lack the
  // column, and a frozen=false default keeps the wallet working until the
  // migration is run.
  const profilePromise = client
    .from('profiles')
    .select('tx_frozen')
    .eq('id', userId)
    .maybeSingle()
    .then(
      (r) => (r.data as { tx_frozen?: boolean } | null)?.tx_frozen === true,
      () => false,
    )

  const [{ data: balRows, error: balError }, { data: txRows, error: txError }, frozen] =
    await Promise.all([
      client.from('wallet_balances').select('asset,balance').eq('user_id', userId),
      client
        .from('transactions')
        .select('id,type,asset,amount,detail,created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(200),
      profilePromise,
    ])
  if (balError) throw new Error(balError.message)
  if (txError) throw new Error(txError.message)

  let balances: Record<string, number> = {}
  for (const r of (balRows ?? []) as Array<{ asset: string; balance: number }>) {
    balances[r.asset] = Number(r.balance)
  }

  const transactions: LocalTx[] = ((txRows ?? []) as Array<{
    id: string
    type: LocalTx['type']
    asset: string
    amount: number
    detail: string | null
    created_at: string
  }>).map((r) => ({
    id: r.id,
    type: r.type,
    asset: r.asset,
    amount: Number(r.amount),
    detail: r.detail ?? undefined,
    date: r.created_at,
  }))

  return { balances, transactions, frozen }
}

/**
 * Persists the full balance map and optionally appends one ledger entry.
 * Fire-and-forget safe: resolves silently when the wallet is local-only.
 */
export async function persistWalletMutation(
  balances: Record<string, number>,
  tx?: ServerTxInput,
): Promise<void> {
  const client = supabase
  const userId = serverWalletUser()
  if (!client || !userId) return
  const rows = Object.entries(balances).map(([asset, balance]) => ({
    user_id: userId,
    asset,
    balance,
  }))
  // New users start at zero: an empty map upserts nothing (PostgREST rejects
  // empty arrays), the ledger entry below still records the mutation.
  if (rows.length > 0) {
    const { error } = await client.from('wallet_balances').upsert(rows, { onConflict: 'user_id,asset' })
    if (error) throw new Error(error.message)
  }
  if (tx) {
    const { error: txError } = await client.from('transactions').insert({
      user_id: userId,
      type: tx.type,
      asset: tx.asset,
      amount: tx.amount,
      detail: tx.detail ?? null,
    })
    if (txError) throw new Error(txError.message)
  }
}
