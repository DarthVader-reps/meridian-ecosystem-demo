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

export const SUPABASE_URL = https://gpjlbsgsobbybjsjzxni.supabase.co''
export const SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdwamxic2dzb2JieWJqc2p6eG5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3OTkzNTMsImV4cCI6MjEwNjM3NTM1M30.lKsdBCFDPrYEn5yWcYhc_izu3lnkqg7kQukt_69sIL4''

export const isSupabaseConfigured = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0
