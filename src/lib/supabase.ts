import { createClient } from '@supabase/supabase-js'
import { createRecoveryTracker, isPasswordRecoveryCallback } from './authRecovery'

// Capture intent before Supabase parses and removes the callback fragment.
export const passwordRecovery = createRecoveryTracker(typeof window !== 'undefined' && isPasswordRecoveryCallback(window.location.hash))

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

// Subscribe immediately, rather than waiting for the lazy-loaded owner page.
// A normal session refresh or sign-in never enables password recovery.
supabase?.auth.onAuthStateChange(event => passwordRecovery.handle(event))

export const CATALOG_BUCKET = 'catalog-images'
