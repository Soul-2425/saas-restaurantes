import { NextRequest } from 'next/server'
import { apiSuccess, apiError, getAuthUser, verifyTenantAccess } from '@/lib/api'
import { CreateMesaSchema } from '@/lib/validators'
import { ZodError } from 'zod'

// GET /api/mesas?restaurante_id=xxx[&tipo_espacio=billar][&estado=disponible]
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
      .from('mesas')
      .select('*')
      .eq('restaurante_id', restauranteId)
      .order('numero')

    const tipoEspacio = searchParams.get('tipo_espacio')
    const estado = searchParams.get('estado')
    if (tipoEspacio) query = query.eq('tipo_espacio', tipoEspacio)
    if (estado) query = query.eq('estado', estado)

    const { data, error } = await query
    if (error) return apiError(error.message, 500)
    return apiSuccess(data)
  } catch {
    return apiError('Error interno del servidor', 500)
  }
}

// POST /api/mesas
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthUser()
    if (!user) return apiError('No autenticado', 401)

    const body = await request.json()
    const validated = CreateMesaSchema.parse(body)

    const { allowed } = await verifyTenantAccess(validated.restaurante_id, user.id, ['dueño', 'supervisor'])
    if (!allowed) return apiError('Sin permisos para crear mesas', 403)

    const { data, error } = await supabase.from('mesas').insert(validated).select().single()
    if (error) return apiError(error.message, 500)
    return apiSuccess(data, undefined, 201)
  } catch (err) {
    if (err instanceof ZodError) return apiError(err.issues[0].message, 422)
    return apiError('Error interno del servidor', 500)
  }
}
