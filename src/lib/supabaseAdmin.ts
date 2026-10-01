import { supabase } from './supabase'
import { isSupabaseConfigured } from '../config/supabase'

export interface SupabaseProfile {
  id: string
  name: string
  email: string | null
  role: 'user' | 'admin'
  status: 'active' | 'suspended'
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
      .select('id,name,email,role,status,created_at')
      .order('created_at', { ascending: false })
    if (error) return { profiles: [], error: error.message }
    return { profiles: (data ?? []) as SupabaseProfile[], error: null }
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
