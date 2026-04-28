import { NextRequest } from 'next/server'
import { apiSuccess, apiError, getAuthUser, verifyTenantAccess } from '@/lib/api'
import { UpdateReservaSchema } from '@/lib/validators'
import { ZodError } from 'zod'

type Params = { params: Promise<{ id: string }> }

// GET /api/reservas/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const { user, supabase } = await getAuthUser()
    if (!user) return apiError('No autenticado', 401)

    const { data, error } = await supabase
      .from('reservas')
      .select('*, mesas(numero, tipo_espacio, capacidad)')
      .eq('id', id)
      .single()

    if (error || !data) return apiError('Reserva no encontrada', 404)
    return apiSuccess(data)
  } catch {
    return apiError('Error interno del servidor', 500)
  }
}

// PATCH /api/reservas/[id] — Confirmar, cancelar o completar
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const { user, supabase } = await getAuthUser()
    if (!user) return apiError('No autenticado', 401)

    const body = await request.json()
    const { estado } = UpdateReservaSchema.parse(body)

    // Verificar acceso al tenant
    const { data: reserva } = await supabase
      .from('reservas')
      .select('restaurante_id')
      .eq('id', id)
      .single()

    if (!reserva) return apiError('Reserva no encontrada', 404)

    const { allowed } = await verifyTenantAccess(reserva.restaurante_id, user.id)
    if (!allowed) return apiError('Acceso denegado', 403)

    const { data, error } = await supabase
      .from('reservas')
      .update({ estado })
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
