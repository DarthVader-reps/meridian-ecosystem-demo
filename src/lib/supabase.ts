import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from '../config/supabase'
import { setAuthAdapter, type AuthAdapter, type AuthResult, type AuthUser } from './auth'

/** Supabase client, or null when the config placeholders are still empty. */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

function toAuthUser(u: User): AuthUser {
  return {
    id: u.id,
    email: u.email ?? '',
    name: (u.user_metadata?.['name'] as string | undefined) ?? '',
    createdAt: u.created_at,
  }
}

function requireClient(): SupabaseClient {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

export const supabaseAdapter: AuthAdapter = {
  async signUp(name, email, password): Promise<AuthResult> {
    const client = requireClient()
    const cleanName = name.trim()
    const cleanEmail = email.trim().toLowerCase()
    if (cleanName.length < 2) return { user: null, error: 'Please enter your name.' }
    if (password.length < 8) return { user: null, error: 'Password must be at least 8 characters.' }

    const { data, error } = await client.auth.signUp({
      email: cleanEmail,
      password,
      options: { data: { name: cleanName } },
    })
    if (error) return { user: null, error: error.message }
    // If email confirmation is on, there is no session yet — user must click the link.
    if (!data.session) {
      return { user: null, error: 'Account created — check your email to confirm, then log in.' }
    }
    return { user: data.user ? toAuthUser(data.user) : null, error: null }
  },

  async signIn(email, password): Promise<AuthResult> {
    const client = requireClient()
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    if (error) return { user: null, error: error.message }
    return { user: data.user ? toAuthUser(data.user) : null, error: null }
  },

  async signOut(): Promise<void> {
    await requireClient().auth.signOut()
  },

  async getSession(): Promise<AuthUser | null> {
    const { data } = await requireClient().auth.getSession()
    return data.session?.user ? toAuthUser(data.session.user) : null
  },
}

/* Auto-swap: when Supabase is configured, it replaces the demo adapter for the
 * whole app. No page changes needed. Import this module once at startup. */
if (supabase) {
  setAuthAdapter(supabaseAdapter)
}
