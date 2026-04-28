import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/api'

export async function POST() {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()
    if (error) return apiError(error.message, 500)
    return apiSuccess({ message: 'Sesión cerrada correctamente.' })
  } catch {
    return apiError('Error interno del servidor', 500)
  }
}
