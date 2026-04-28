import { NextRequest } from 'next/server'
import { apiSuccess, apiError, getAuthUser, verifyTenantAccess } from '@/lib/api'
import { CreatePedidoSchema } from '@/lib/validators'
import { ZodError } from 'zod'

// GET /api/pedidos?restaurante_id=xxx[&estado=abierto][&mesa_id=yyy]
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
      .from('pedidos')
      .select('*, mesas(numero, tipo_espacio), pedidos_items(id, nombre_producto, cantidad, precio_unitario, subtotal, notas)')
      .eq('restaurante_id', restauranteId)
      .order('created_at', { ascending: false })

    const estado = searchParams.get('estado')
    const mesaId = searchParams.get('mesa_id')
    const estadoPago = searchParams.get('estado_pago')
    if (estado) query = query.eq('estado', estado)
    if (mesaId) query = query.eq('mesa_id', mesaId)
    if (estadoPago) query = query.eq('estado_pago', estadoPago)

    const { data, error } = await query
    if (error) return apiError(error.message, 500)
    return apiSuccess(data)
  } catch {
    return apiError('Error interno del servidor', 500)
  }
}

// POST /api/pedidos — Abre un nuevo pedido
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthUser()
    if (!user) return apiError('No autenticado', 401)

    const body = await request.json()
    const validated = CreatePedidoSchema.parse(body)

    const { allowed } = await verifyTenantAccess(validated.restaurante_id, user.id)
    if (!allowed) return apiError('Acceso denegado', 403)

    // Si hay mesa, cambiar su estado a 'ocupada'
    if (validated.mesa_id) {
      await supabase
        .from('mesas')
        .update({ estado: 'ocupada' })
        .eq('id', validated.mesa_id)
    }

    const { data, error } = await supabase
      .from('pedidos')
      .insert({ ...validated, estado: 'abierto', total: 0, estado_pago: 'sin_pago' })
      .select()
      .single()

    if (error) return apiError(error.message, 500)
    return apiSuccess(data, undefined, 201)
  } catch (err) {
    if (err instanceof ZodError) return apiError(err.issues[0].message, 422)
    return apiError('Error interno del servidor', 500)
  }
}
