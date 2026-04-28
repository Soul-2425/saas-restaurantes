import { NextRequest } from 'next/server'
import { apiSuccess, apiError, getAuthUser, verifyTenantAccess } from '@/lib/api'
import { CreateReservaSchema } from '@/lib/validators'
import { ZodError } from 'zod'

// GET /api/reservas?restaurante_id=xxx[&fecha=2025-12-31][&estado=pendiente]
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthUser()
    if (!user) return apiError('No autenticado', 401)

    const { searchParams } = new URL(request.url)
    const restauranteId = searchParams.get('restaurante_id')
    if (!restauranteId) return apiError('restaurante_id es requerido', 400)

    const { allowed } = await verifyTenantAccess(restauranteId, user.id)
    if (!allowed) return apiError('Acceso denegado', 403)

    let query = supabase
      .from('reservas')
      .select('*, mesas(numero, tipo_espacio)')
      .eq('restaurante_id', restauranteId)
      .order('fecha_hora')

    const fecha = searchParams.get('fecha')
    const estado = searchParams.get('estado')
    if (fecha) {
      const start = new Date(fecha); start.setHours(0, 0, 0, 0)
      const end   = new Date(fecha); end.setHours(23, 59, 59, 999)
      query = query.gte('fecha_hora', start.toISOString()).lte('fecha_hora', end.toISOString())
    }
    if (estado) query = query.eq('estado', estado)

    const { data, error } = await query
    if (error) return apiError(error.message, 500)
    return apiSuccess(data)
  } catch {
    return apiError('Error interno del servidor', 500)
  }
}

// POST /api/reservas
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthUser()
    if (!user) return apiError('No autenticado', 401)

    const body = await request.json()
    const validated = CreateReservaSchema.parse(body)

    const { allowed } = await verifyTenantAccess(validated.restaurante_id, user.id)
    if (!allowed) return apiError('Acceso denegado', 403)

    // Verificar disponibilidad si se indica mesa
    if (validated.mesa_id) {
      const { data: conflicto } = await supabase
        .from('reservas')
        .select('id')
        .eq('mesa_id', validated.mesa_id)
        .eq('estado', 'confirmada')
        .gte('fecha_hora', new Date(new Date(validated.fecha_hora).getTime() - 60 * 60 * 1000).toISOString())
        .lte('fecha_hora', new Date(new Date(validated.fecha_hora).getTime() + 60 * 60 * 1000).toISOString())
        .maybeSingle()

      if (conflicto) return apiError('La mesa ya tiene una reserva en ese horario', 409)
    }

    const { data, error } = await supabase.from('reservas').insert(validated).select().single()
    if (error) return apiError(error.message, 500)
    return apiSuccess(data, undefined, 201)
  } catch (err) {
    if (err instanceof ZodError) return apiError(err.issues[0].message, 422)
    return apiError('Error interno del servidor', 500)
  }
}
