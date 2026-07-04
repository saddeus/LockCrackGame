import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Null until VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY are set (see
// web/.env.example) — callers should treat a missing leaderboard as
// "not configured yet" rather than crash.
export const supabase = url && anonKey ? createClient(url, anonKey) : null
