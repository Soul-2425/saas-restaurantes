import { NextRequest } from 'next/server'
import { apiSuccess, apiError, getAuthUser, verifyTenantAccess } from '@/lib/api'
import { RegistrarPagoSchema, VerificarPagoSchema } from '@/lib/validators'
import { PaymentGatewayFactory } from '@/lib/services/payment-gateway.factory'
import { ZodError } from 'zod'

type Params = { params: Promise<{ id: string }> }

/**
 * POST /api/pedidos/[id]/pago
 * Empleado registra el pago → estado pasa a "pendiente_verificacion"
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id: pedidoId } = await params
    const { user, supabase } = await getAuthUser()
    if (!user) return apiError('No autenticado', 401)

    const body = await request.json()
    const { metodo_pago, monto_recibido, moneda, referencia_pago } = RegistrarPagoSchema.parse(body)

    // Verificar pedido
    const { data: pedido } = await supabase
      .from('pedidos')
      .select('restaurante_id, total, estado, estado_pago, moneda')
      .eq('id', pedidoId)
      .single()

    if (!pedido) return apiError('Pedido no encontrado', 404)
    if (pedido.estado_pago === 'pagado') return apiError('Este pedido ya fue pagado', 409)

    const { allowed } = await verifyTenantAccess(pedido.restaurante_id, user.id)
    if (!allowed) return apiError('Acceso denegado', 403)

    // Usar el PaymentGateway (actualmente flujo manual)
    const gateway = PaymentGatewayFactory.create()
    const intent  = await gateway.createPaymentIntent({
      pedidoId,
      restauranteId: pedido.restaurante_id,
      amount: monto_recibido.toString(),
      currency: moneda,
      metodoPago: metodo_pago,
      referencia: referencia_pago,
    })

    // Actualizar pedido con datos del pago → pendiente_verificacion
    const { data, error } = await supabase
      .from('pedidos')
      .update({
        metodo_pago,
        monto_recibido: monto_recibido.toString(),
        moneda,
        referencia_pago: referencia_pago ?? intent.id,
        estado_pago: 'pendiente_verificacion',
        estado: 'cerrado',  // Cierra el pedido operativamente
      })
      .eq('id', pedidoId)
      .select()
      .single()

    if (error) return apiError(error.message, 500)

    // Liberar mesa si aplica
    const { data: pedidoFull } = await supabase
      .from('pedidos')
      .select('mesa_id')
      .eq('id', pedidoId)
      .single()

    if (pedidoFull?.mesa_id) {
      await supabase
        .from('mesas')
        .update({ estado: 'disponible' })
        .eq('id', pedidoFull.mesa_id)
    }

    return apiSuccess({
      pedido: data,
      payment_intent: intent,
      message: 'Pago registrado. Pendiente de verificación por supervisor/dueño.',
    })
  } catch (err) {
    if (err instanceof ZodError) return apiError(err.issues[0].message, 422)
    return apiError('Error interno del servidor', 500)
  }
}

/**
 * PATCH /api/pedidos/[id]/pago
 * Supervisor/Dueño aprueba o rechaza el pago → estado_pago: "pagado" | "rechazado"
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id: pedidoId } = await params
    const { user, supabase } = await getAuthUser()
    if (!user) return apiError('No autenticado', 401)

    const body = await request.json()
    const { accion, notas } = VerificarPagoSchema.parse(body)

    const { data: pedido } = await supabase
      .from('pedidos')
      .select('restaurante_id, estado_pago')
      .eq('id', pedidoId)
      .single()

    if (!pedido) return apiError('Pedido no encontrado', 404)
    if (pedido.estado_pago !== 'pendiente_verificacion') {
      return apiError('El pedido no está pendiente de verificación', 409)
    }

    // Solo dueño o supervisor pueden verificar pagos
    const { allowed } = await verifyTenantAccess(pedido.restaurante_id, user.id, ['dueño', 'supervisor'])
    if (!allowed) return apiError('Solo supervisores y dueños pueden verificar pagos', 403)

    const nuevoEstado = accion === 'aprobar' ? 'pagado' : 'rechazado'

    const { data, error } = await supabase
      .from('pedidos')
      .update({
        estado_pago: nuevoEstado,
        verificado_por: user.id,
        verificado_en: new Date().toISOString(),
        notas_verificacion: notas ?? null,
      })
      .eq('id', pedidoId)
      .select()
      .single()

    if (error) return apiError(error.message, 500)

    return apiSuccess({
      pedido: data,
      message: accion === 'aprobar' ? '✅ Pago aprobado correctamente.' : '❌ Pago rechazado.',
    })
  } catch (err) {
    if (err instanceof ZodError) return apiError(err.issues[0].message, 422)
    return apiError('Error interno del servidor', 500)
  }
}
