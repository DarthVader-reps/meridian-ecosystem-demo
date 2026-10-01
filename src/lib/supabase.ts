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
    if (!data.user) return { user: null, error: 'Sign in failed.' }
    // Enforce admin suspension: a suspended profile cannot start a session.
    const { data: profile } = await client
      .from('profiles')
      .select('status')
      .eq('id', data.user.id)
      .single()
    if (profile?.status === 'suspended') {
      await client.auth.signOut()
      return { user: null, error: 'This account has been suspended. Contact support.' }
    }
    return { user: toAuthUser(data.user), error: null }
  },

  async signOut(): Promise<void> {
    await requireClient().auth.signOut()
  },

  async getSession(): Promise<AuthUser | null> {
    const { data } = await requireClient().auth.getSession()
    return data.session?.user ? toAuthUser(data.session.user) : null
  },

  async resetPassword(email: string): Promise<{ error: string | null }> {
    const client = requireClient()
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) return { error: 'Please enter your email address.' }
    const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}#/reset-password`
    const { error } = await client.auth.resetPasswordForEmail(cleanEmail, { redirectTo })
    if (error) return { error: error.message }
    return { error: null }
  },
}

/**
 * Extracts Supabase recovery tokens from the URL hash.
 *
 * The recovery email links to `<site>/#/reset-password#access_token=…&refresh_token=…&type=recovery`
 * (note the double `#` — one from HashRouter, one from Supabase). Returns the
 * tokens, or null when the link is missing, malformed, or not a recovery link.
 */
export function parseRecoveryTokens(
  hash: string,
): { access_token: string; refresh_token: string } | null {
  const fragment = hash.split('#').slice(2).join('#')
  if (!fragment) return null
  const params = new URLSearchParams(fragment)
  if (params.get('type') !== 'recovery') return null
  const access_token = params.get('access_token')
  const refresh_token = params.get('refresh_token')
  if (!access_token || !refresh_token) return null
  return { access_token, refresh_token }
}

/* Auto-swap: when Supabase is configured, it replaces the demo adapter for the
 * whole app. No page changes needed. Import this module once at startup. */
if (supabase) {
  setAuthAdapter(supabaseAdapter)
}
