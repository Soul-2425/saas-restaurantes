import { NextRequest } from 'next/server'
import { apiSuccess, apiError, getAuthUser, verifyTenantAccess } from '@/lib/api'
import { UpdateReservaSchema } from '@/lib/validators'
import { ZodError } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'

// PATCH /api/reservas/[id]
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user } = await getAuthUser()
    if (!user) return apiError('No autenticado', 401)

    const adminClient = await createAdminClient()
    
    // Primero, obtener a qué restaurante pertenece la reserva
    const { data: reserva, error: findErr } = await adminClient
      .from('reservas')
      .select('restaurante_id')
      .eq('id', params.id)
      .single()

    if (findErr || !reserva) return apiError('Reserva no encontrada', 404)

    const { allowed } = await verifyTenantAccess(reserva.restaurante_id, user.id, ['dueño', 'supervisor', 'empleado'])
    if (!allowed) return apiError('Sin permisos', 403)

    const body = await request.json()
    const validated = UpdateReservaSchema.parse(body)

    const { data, error } = await adminClient
      .from('reservas')
      .update(validated)
      .eq('id', params.id)
      .select()
      .single()

    if (error) return apiError(error.message, 500)
    return apiSuccess(data)
  } catch (err) {
    if (err instanceof ZodError) return apiError(err.issues[0].message, 422)
    return apiError('Error interno del servidor', 500)
  }
}
