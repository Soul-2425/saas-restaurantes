import { NextRequest } from 'next/server'
import { apiSuccess, apiError, getAuthUser, verifyTenantAccess } from '@/lib/api'
import { UpdateConfigSchema } from '@/lib/validators'
import { ZodError } from 'zod'

// GET /api/configuracion?restaurante_id=xxx
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthUser()
    if (!user) return apiError('No autenticado', 401)

    const { searchParams } = new URL(request.url)
    const restauranteId = searchParams.get('restaurante_id')
    if (!restauranteId) return apiError('restaurante_id es requerido', 400)

    const { allowed } = await verifyTenantAccess(restauranteId, user.id)
    if (!allowed) return apiError('Acceso denegado', 403)

    const { data, error } = await supabase
      .from('configuracion_restaurante')
      .select('*')
      .eq('restaurante_id', restauranteId)
      .single()

    if (error) return apiError('Configuración no encontrada', 404)
    return apiSuccess(data)
  } catch {
    return apiError('Error interno del servidor', 500)
  }
}

// PATCH /api/configuracion?restaurante_id=xxx — Solo dueño
export async function PATCH(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthUser()
    if (!user) return apiError('No autenticado', 401)

    const { searchParams } = new URL(request.url)
    const restauranteId = searchParams.get('restaurante_id')
    if (!restauranteId) return apiError('restaurante_id es requerido', 400)

    const { allowed } = await verifyTenantAccess(restauranteId, user.id, ['dueño'])
    if (!allowed) return apiError('Solo el dueño puede modificar la configuración', 403)

    const body = await request.json()
    const validated = UpdateConfigSchema.parse(body)

    const { data, error } = await supabase
      .from('configuracion_restaurante')
      .update({ ...validated, updated_at: new Date().toISOString() })
      .eq('restaurante_id', restauranteId)
      .select()
      .single()

    if (error) return apiError(error.message, 500)
    return apiSuccess(data)
  } catch (err) {
    if (err instanceof ZodError) return apiError(err.issues[0].message, 422)
    return apiError('Error interno del servidor', 500)
  }
}
