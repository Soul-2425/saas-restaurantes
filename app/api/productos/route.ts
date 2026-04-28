import { NextRequest } from 'next/server'
import { apiSuccess, apiError, getAuthUser, verifyTenantAccess } from '@/lib/api'
import { CreateProductoSchema } from '@/lib/validators'
import { ZodError } from 'zod'

// GET /api/productos?restaurante_id=xxx[&categoria=bebidas][&es_por_tiempo=true]
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
      .from('productos')
      .select('*')
      .eq('restaurante_id', restauranteId)
      .order('categoria')
      .order('nombre')

    const categoria = searchParams.get('categoria')
    const esPorTiempo = searchParams.get('es_por_tiempo')
    if (categoria) query = query.eq('categoria', categoria)
    if (esPorTiempo !== null) query = query.eq('es_por_tiempo', esPorTiempo === 'true')

    const { data, error } = await query
    if (error) return apiError(error.message, 500)
    return apiSuccess(data)
  } catch {
    return apiError('Error interno del servidor', 500)
  }
}

// POST /api/productos
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthUser()
    if (!user) return apiError('No autenticado', 401)

    const body = await request.json()
    const validated = CreateProductoSchema.parse(body)

    const { allowed } = await verifyTenantAccess(validated.restaurante_id, user.id, ['dueño', 'supervisor'])
    if (!allowed) return apiError('Sin permisos para crear productos', 403)

    const { data, error } = await supabase.from('productos').insert(validated).select().single()
    if (error) return apiError(error.message, 500)
    return apiSuccess(data, undefined, 201)
  } catch (err) {
    if (err instanceof ZodError) return apiError(err.issues[0].message, 422)
    return apiError('Error interno del servidor', 500)
  }
}
