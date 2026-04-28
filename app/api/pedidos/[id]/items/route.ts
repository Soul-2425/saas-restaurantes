import { NextRequest } from 'next/server'
import { apiSuccess, apiError, getAuthUser } from '@/lib/api'
import { AddItemPedidoSchema } from '@/lib/validators'
import { Decimal } from 'decimal.js'
import { ZodError } from 'zod'

type Params = { params: Promise<{ id: string }> }

// POST /api/pedidos/[id]/items — Agrega un ítem al pedido y recalcula el total
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id: pedidoId } = await params
    const { user, supabase } = await getAuthUser()
    if (!user) return apiError('No autenticado', 401)

    const body = await request.json()
    const validated = AddItemPedidoSchema.parse(body)

    // Verificar que el pedido exista y esté abierto
    const { data: pedido } = await supabase
      .from('pedidos')
      .select('id, estado, total, restaurante_id')
      .eq('id', pedidoId)
      .single()

    if (!pedido) return apiError('Pedido no encontrado', 404)
    if (pedido.estado !== 'abierto' && pedido.estado !== 'en_preparacion') {
      return apiError('No se pueden agregar ítems a un pedido cerrado', 409)
    }

    // Obtener el producto para snapshot del nombre
    const { data: producto } = await supabase
      .from('productos')
      .select('nombre, precio, stock, es_por_tiempo')
      .eq('id', validated.producto_id)
      .single()

    if (!producto) return apiError('Producto no encontrado', 404)

    // Descontar stock si no es por tiempo
    if (!producto.es_por_tiempo && producto.stock < validated.cantidad) {
      return apiError(`Stock insuficiente. Disponible: ${producto.stock}`, 409)
    }

    // Insertar ítem con nombre snapshot (para auditoría histórica)
    const { data: item, error: itemError } = await supabase
      .from('pedidos_items')
      .insert({
        pedido_id: pedidoId,
        producto_id: validated.producto_id,
        nombre_producto: producto.nombre,        // snapshot
        precio_unitario: validated.precio_unitario.toString(),
        cantidad: validated.cantidad,
        notas: validated.notas ?? null,
      })
      .select()
      .single()

    if (itemError) return apiError(itemError.message, 500)

    // Recalcular total con Decimal.js (alta precisión, sin redondeo)
    const nuevoSubtotal = new Decimal(validated.precio_unitario).mul(validated.cantidad)
    const totalActual   = new Decimal(pedido.total ?? 0)
    const nuevoTotal    = totalActual.plus(nuevoSubtotal)

    await supabase
      .from('pedidos')
      .update({ total: nuevoTotal.toString() })
      .eq('id', pedidoId)

    // Descontar stock
    if (!producto.es_por_tiempo) {
      await supabase
        .from('productos')
        .update({ stock: producto.stock - validated.cantidad })
        .eq('id', validated.producto_id)
    }

    return apiSuccess({ item, nuevo_total: nuevoTotal.toString() }, undefined, 201)
  } catch (err) {
    if (err instanceof ZodError) return apiError(err.issues[0].message, 422)
    return apiError('Error interno del servidor', 500)
  }
}

// DELETE /api/pedidos/[id]/items?item_id=xxx — Quita un ítem y recalcula el total
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id: pedidoId } = await params
    const { user, supabase } = await getAuthUser()
    if (!user) return apiError('No autenticado', 401)

    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('item_id')
    if (!itemId) return apiError('item_id es requerido', 400)

    // Obtener ítem y pedido
    const { data: item } = await supabase
      .from('pedidos_items')
      .select('precio_unitario, cantidad, producto_id')
      .eq('id', itemId)
      .eq('pedido_id', pedidoId)
      .single()

    if (!item) return apiError('Ítem no encontrado', 404)

    const { data: pedido } = await supabase
      .from('pedidos')
      .select('total, estado')
      .eq('id', pedidoId)
      .single()

    if (!pedido) return apiError('Pedido no encontrado', 404)
    if (pedido.estado !== 'abierto') return apiError('No se pueden quitar ítems de un pedido cerrado', 409)

    // Eliminar ítem
    await supabase.from('pedidos_items').delete().eq('id', itemId)

    // Recalcular total con alta precisión
    const subtotal   = new Decimal(item.precio_unitario).mul(item.cantidad)
    const nuevoTotal = new Decimal(pedido.total ?? 0).minus(subtotal)

    await supabase
      .from('pedidos')
      .update({ total: nuevoTotal.toString() })
      .eq('id', pedidoId)

    // Restaurar stock
    const { data: producto } = await supabase
      .from('productos')
      .select('stock, es_por_tiempo')
      .eq('id', item.producto_id)
      .maybeSingle()

    if (producto && !producto.es_por_tiempo) {
      await supabase
        .from('productos')
        .update({ stock: producto.stock + item.cantidad })
        .eq('id', item.producto_id)
    }

    return apiSuccess({ nuevo_total: nuevoTotal.toString() })
  } catch {
    return apiError('Error interno del servidor', 500)
  }
}
