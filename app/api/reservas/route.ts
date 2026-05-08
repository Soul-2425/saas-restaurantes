import { NextRequest } from 'next/server'
import { apiSuccess, apiError, getAuthUser, verifyTenantAccess } from '@/lib/api'
import { CreateReservaSchema } from '@/lib/validators'
import { ZodError } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/reservas?restaurante_id=xxx[&fecha=YYYY-MM-DD]
export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthUser()
    if (!user) return apiError('No autenticado', 401)

    const { searchParams } = new URL(request.url)
    const restauranteId = searchParams.get('restaurante_id')
    if (!restauranteId) return apiError('restaurante_id es requerido', 400)

    const { allowed } = await verifyTenantAccess(restauranteId, user.id)
    if (!allowed) return apiError('Acceso denegado', 403)

    const adminClient = await createAdminClient()
    let query = adminClient
      .from('reservas')
      .select('*, mesas(numero)')
      .eq('restaurante_id', restauranteId)
      .order('fecha_hora', { ascending: true })

    const fecha = searchParams.get('fecha')
    if (fecha) {
      // Filtrar por fecha específica (ignorar hora)
      const startOfDay = new Date(fecha).toISOString()
      const endOfDay = new Date(new Date(fecha).getTime() + 24 * 60 * 60 * 1000).toISOString()
      query = query.gte('fecha_hora', startOfDay).lt('fecha_hora', endOfDay)
    }

    const { data, error } = await query
    if (error) return apiError(error.message, 500)
    return apiSuccess(data)
  } catch (err) {
    return apiError('Error interno del servidor', 500)
  }
}

// POST /api/reservas
export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthUser()
    if (!user) return apiError('No autenticado', 401)

    const body = await request.json()
    const validated = CreateReservaSchema.parse(body)

    const { allowed } = await verifyTenantAccess(validated.restaurante_id, user.id, ['dueño', 'supervisor', 'empleado'])
    if (!allowed) return apiError('Sin permisos para crear reservas', 403)

    const adminClient = await createAdminClient()
    const { data, error } = await adminClient
      .from('reservas')
      .insert(validated)
      .select()
      .single()
      
    if (error) return apiError(error.message, 500)
    return apiSuccess(data, undefined, 201)
  } catch (err) {
    if (err instanceof ZodError) return apiError(err.issues[0].message, 422)
    return apiError('Error interno del servidor', 500)
  }
}
