import { isSupabaseConfigured } from '../config/supabase'

/** Auth-mode label shown under the login/signup forms. Follows the active backend. */
export default function AuthLabel({ suffix }: { suffix?: string }) {
  const base = isSupabaseConfigured
    ? 'Secured by Supabase Auth.'
    : 'Demo auth — accounts live in this browser only.'
  return (
    <p className="mt-4 text-center text-xs text-muted">
      {base}
      {suffix ? ` ${suffix}` : ''}
    </p>
  )
}
