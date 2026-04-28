import { NextRequest } from 'next/server'
import { apiSuccess, apiError, getAuthUser, verifyTenantAccess } from '@/lib/api'
import { UpdatePedidoSchema } from '@/lib/validators'
import { ZodError } from 'zod'

type Params = { params: Promise<{ id: string }> }

// GET /api/pedidos/[id] — Detalle completo con ítems
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const { user, supabase } = await getAuthUser()
    if (!user) return apiError('No autenticado', 401)

    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        mesas(numero, tipo_espacio),
        pedidos_items(id, producto_id, nombre_producto, cantidad, precio_unitario, subtotal, notas)
      `)
      .eq('id', id)
      .single()

    if (error || !data) return apiError('Pedido no encontrado', 404)
    return apiSuccess(data)
  } catch {
    return apiError('Error interno del servidor', 500)
  }
}

// PATCH /api/pedidos/[id] — Cambiar estado del pedido
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const { user, supabase } = await getAuthUser()
    if (!user) return apiError('No autenticado', 401)

    const body = await request.json()
    const { estado } = UpdatePedidoSchema.parse(body)

    // Verificar tenant
    const { data: pedido } = await supabase
      .from('pedidos')
      .select('restaurante_id, mesa_id, estado')
      .eq('id', id)
      .single()

    if (!pedido) return apiError('Pedido no encontrado', 404)

    const { allowed } = await verifyTenantAccess(pedido.restaurante_id, user.id)
    if (!allowed) return apiError('Acceso denegado', 403)

    // Al cerrar el pedido, liberar la mesa
    const updates: Record<string, unknown> = { estado }
    if (estado === 'cerrado' || estado === 'cancelado') {
      if (pedido.mesa_id) {
        await supabase
          .from('mesas')
          .update({ estado: 'disponible' })
          .eq('id', pedido.mesa_id)
      }
    }

    const { data, error } = await supabase
      .from('pedidos')
      .update(updates)
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

// DELETE /api/pedidos/[id] — Solo cancelar pedidos abiertos (dueño/supervisor)
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const { user, supabase } = await getAuthUser()
    if (!user) return apiError('No autenticado', 401)

    const { data: pedido } = await supabase
      .from('pedidos')
      .select('restaurante_id, mesa_id, estado')
      .eq('id', id)
      .single()

    if (!pedido) return apiError('Pedido no encontrado', 404)

    const { allowed } = await verifyTenantAccess(pedido.restaurante_id, user.id, ['dueño', 'supervisor'])
    if (!allowed) return apiError('Sin permisos para eliminar pedidos', 403)

    if (!['abierto', 'cancelado'].includes(pedido.estado)) {
      return apiError('Solo se pueden eliminar pedidos abiertos o cancelados', 409)
    }

    if (pedido.mesa_id) {
      await supabase.from('mesas').update({ estado: 'disponible' }).eq('id', pedido.mesa_id)
    }

    const { error } = await supabase.from('pedidos').delete().eq('id', id)
    if (error) return apiError(error.message, 500)
    return apiSuccess({ message: 'Pedido eliminado.' })
  } catch {
    return apiError('Error interno del servidor', 500)
  }
}
