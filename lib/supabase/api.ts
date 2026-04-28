import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Client per utilitzar en API routes (no necessita cookies)
 * Utilitza la service role key per operacions sense autenticació d'usuari
 */
export function createApiClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createSupabaseClient(supabaseUrl, supabaseKey, {
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-supabase-api-version': '2024-01-01' // Forçar versió recent sense cache
      }
    }
  })
}
