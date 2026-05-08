import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/** Cliente Supabase server-side (usa cookies de sesión del usuario). */
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignorado en Server Components (solo aplica en Route Handlers)
          }
        },
      },
    }
  )
}

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/** Cliente admin con service_role (bypassa RLS). Usar solo en operaciones privilegiadas. */
export async function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
