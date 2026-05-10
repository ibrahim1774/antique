import { createClient } from '@supabase/supabase-js'

// Lazy singletons — clients are created on first use, not at module load.
// This prevents build-time failures when env vars are empty.

let _supabase = null
let _admin = null

export function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }
  return _supabase
}

export function getSupabaseAdmin() {
  if (!_admin) {
    _admin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  }
  return _admin
}
