import { supabase } from './supabase'
import { isSupabaseConfigured } from '../config/supabase'
import { serverWalletUser } from './walletServer'

/**
 * Server-side deposit-request I/O (migration-006: deposit_requests table).
 * Deposits require admin clearance: the client creates the request and
 * advances it through the confirmation flow, but only an admin can flip it
 * to cleared (which atomically credits the balance) or rejected.
 * Every function degrades to null/void when Supabase is unavailable — the
 * deposits store then falls back to local-only mode.
 */

export type ServerDepositStatus =
  | 'awaiting'
  | 'confirming'
  | 'pending_clearance'
  | 'cleared'
  | 'rejected'
  | 'expired'
  | 'cancelled'

export interface ServerDepositRequest {
  id: string
  user_id: string
  asset: string
  network: string
  amount: number
  address: string
  status: ServerDepositStatus
  created_at: string
  decided_at: string | null
}

function requireServer() {
  if (!supabase || !isSupabaseConfigured) throw new Error('Supabase not configured')
  const userId = serverWalletUser()
  if (!userId) throw new Error('Not signed in')
  return { client: supabase, userId }
}

/** Insert a new request. Returns the server id, or null when unavailable. */
export async function insertDepositRequest(input: {
  asset: string
  network: string
  amount: number
  address: string
}): Promise<string | null> {
  try {
    const { client, userId } = requireServer()
    const { data, error } = await client
      .from('deposit_requests')
      .insert({ user_id: userId, ...input, status: 'awaiting' })
      .select('id')
      .single()
    if (error) throw error
    return (data as { id: string }).id
  } catch (e) {
    console.warn('[deposits] server insert failed — local fallback', e)
    return null
  }
}

/** Advance the request's status (never to cleared/rejected — RLS forbids it). */
export async function updateDepositRequestStatus(id: string, status: ServerDepositStatus): Promise<void> {
  try {
    const { client } = requireServer()
    const { error } = await client.from('deposit_requests').update({ status }).eq('id', id)
    if (error) throw error
  } catch (e) {
    console.warn('[deposits] server status update failed', e)
  }
}

/** The signed-in user's own requests, newest first. Null when unavailable. */
export async function fetchOwnDepositRequests(): Promise<ServerDepositRequest[] | null> {
  try {
    const { client, userId } = requireServer()
    const { data, error } = await client
      .from('deposit_requests')
      .select('id,user_id,asset,network,amount,address,status,created_at,decided_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw error
    return (data ?? []) as ServerDepositRequest[]
  } catch (e) {
    console.warn('[deposits] fetch own requests failed', e)
    return null
  }
}

/** All undecided + recently decided requests. Admin only (RLS enforced). */
export async function fetchAllDepositRequests(): Promise<{ rows: ServerDepositRequest[]; error: string | null }> {
  try {
    if (!supabase || !isSupabaseConfigured) throw new Error('Supabase not configured')
    const { data, error } = await supabase
      .from('deposit_requests')
      .select('id,user_id,asset,network,amount,address,status,created_at,decided_at')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) throw error
    return { rows: (data ?? []) as ServerDepositRequest[], error: null }
  } catch (e) {
    return { rows: [], error: e instanceof Error ? e.message : 'Failed to load deposit requests.' }
  }
}

/** Admin: clear the request — atomically credits the user's balance. */
export async function clearDepositRequest(id: string): Promise<string | null> {
  try {
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase.rpc('clear_deposit_request', { p_request_id: id })
    if (error) throw error
    return null
  } catch (e) {
    return e instanceof Error ? e.message : 'Clear failed.'
  }
}

/** Admin: reject the request. */
export async function rejectDepositRequest(id: string): Promise<string | null> {
  try {
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase.rpc('reject_deposit_request', { p_request_id: id })
    if (error) throw error
    return null
  } catch (e) {
    return e instanceof Error ? e.message : 'Reject failed.'
  }
}
