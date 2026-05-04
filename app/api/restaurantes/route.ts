import { NextRequest } from 'next/server'
import { apiSuccess, apiError, getAuthUser } from '@/lib/api'
import { CreateRestauranteSchema } from '@/lib/validators'
import { ZodError } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/restaurantes — Lista todos los restaurantes del usuario autenticado
export async function GET() {
  try {
    const { user, supabase } = await getAuthUser()
    if (!user) return apiError('No autenticado', 401)

    const { data, error } = await supabase
      .from('usuarios_restaurantes')
      .select('rol, restaurantes(id, nombre, slug, estado_suscripcion, created_at)')
      .eq('usuario_id', user.id)

    if (error) return apiError(error.message, 500)

    const result = (data ?? []).map((r) => ({
      ...(r.restaurantes as unknown as Record<string, unknown>),
      rol: r.rol,
    }))

    return apiSuccess(result)
  } catch {
    return apiError('Error interno del servidor', 500)
  }
}

// POST /api/restaurantes — Crea un nuevo restaurante y asigna al creador como dueño
export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthUser()
    if (!user) return apiError('No autenticado', 401)

    const body = await request.json()
    const validated = CreateRestauranteSchema.parse(body)

    const adminClient = await createAdminClient()

    const { data: restaurante, error: rError } = await adminClient
      .from('restaurantes')
      .insert(validated)
      .select()
      .single()

    if (rError) return apiError(rError.message, 500)

    // Asignar creador como dueño
    await adminClient
      .from('usuarios_restaurantes')
      .insert({ usuario_id: user.id, restaurante_id: restaurante.id, rol: 'dueño' })

    return apiSuccess(restaurante, undefined, 201)
  } catch (err) {
    if (err instanceof ZodError) return apiError(err.issues[0].message, 422)
    return apiError('Error interno del servidor', 500)
  }
}
