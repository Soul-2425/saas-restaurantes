import { NextRequest } from 'next/server'
import { apiSuccess, apiError, getAuthUser, verifyTenantAccess } from '@/lib/api'
import { UpdateRestauranteSchema } from '@/lib/validators'
import { ZodError } from 'zod'

type Params = { params: Promise<{ id: string }> }

// GET /api/restaurantes/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const { user, supabase } = await getAuthUser()
    if (!user) return apiError('No autenticado', 401)

    const { allowed } = await verifyTenantAccess(id, user.id)
    if (!allowed) return apiError('Acceso denegado', 403)

    const { data, error } = await supabase
      .from('restaurantes')
      .select('*, configuracion_restaurante(*)')
      .eq('id', id)
      .single()

    if (error) return apiError('Restaurante no encontrado', 404)
    return apiSuccess(data)
  } catch {
    return apiError('Error interno del servidor', 500)
  }
}

// PATCH /api/restaurantes/[id]
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const { user, supabase } = await getAuthUser()
    if (!user) return apiError('No autenticado', 401)

    const { allowed } = await verifyTenantAccess(id, user.id, ['dueño'])
    if (!allowed) return apiError('Solo el dueño puede modificar el restaurante', 403)

    const body = await request.json()
    const validated = UpdateRestauranteSchema.parse(body)

    const { data, error } = await supabase
      .from('restaurantes')
      .update(validated)
      .eq('id', id)
      .select()
      .single()

    if (error) return apiError(error.message, 500)
    return apiSuccess(data)
  } catch (err) {
    if (err instanceof ZodError) return apiError(err.issues[0].message, 422)
    return apiError('Error interno del servidor', 500)
  }
}

// DELETE /api/restaurantes/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const { user, supabase } = await getAuthUser()
    if (!user) return apiError('No autenticado', 401)

    const { allowed } = await verifyTenantAccess(id, user.id, ['dueño'])
    if (!allowed) return apiError('Solo el dueño puede eliminar el restaurante', 403)

    const { error } = await supabase.from('restaurantes').delete().eq('id', id)
    if (error) return apiError(error.message, 500)
    return apiSuccess({ message: 'Restaurante eliminado.' })
  } catch {
    return apiError('Error interno del servidor', 500)
  }
}
