/* Supabase connection config.
 *
 * Paste your values from the Supabase dashboard:
 *   Project Settings (gear icon) -> Data API -> Project URL + anon public key.
 *
 * The anon key is PUBLIC BY DESIGN — it ships inside the site's JavaScript
 * bundle. Row Level Security (see supabase/schema.sql) is what protects user
 * data, not this key. NEVER put the service_role secret here.
 *
 * Leave both empty to keep using the local demo adapter.
 */

export const SUPABASE_URL = ''
export const SUPABASE_ANON_KEY = ''

export const isSupabaseConfigured = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0
