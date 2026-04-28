import { NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/api'
import { LoginSchema } from '@/lib/validators'
import { ZodError } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = LoginSchema.parse(body)

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) return apiError(error.message, 401)

    // Cargar accesos a restaurantes del usuario
    const adminClient = await createAdminClient()
    const { data: accesos } = await adminClient
      .from('usuarios_restaurantes')
      .select('restaurante_id, rol, restaurantes(id, nombre, slug)')
      .eq('usuario_id', data.user.id)

    return apiSuccess({
      user: { id: data.user.id, email: data.user.email },
      accesos: accesos ?? [],
    })
  } catch (err) {
    if (err instanceof ZodError) return apiError(err.issues[0].message, 422)
    return apiError('Error interno del servidor', 500)
  }
}
