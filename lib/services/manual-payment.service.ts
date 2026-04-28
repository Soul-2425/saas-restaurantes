import type {
  PaymentGateway,
  CreatePaymentParams,
  VerifyPaymentParams,
  RefundParams,
  PaymentIntent,
  PaymentStatus,
} from './payment.interface'

/**
 * Implementación del flujo de verificación manual.
 * El empleado registra el pago → queda en "pendiente_verificacion"
 * → supervisor/dueño confirma → pasa a "pagado" o "rechazado".
 *
 * NO llama a ninguna API externa. La lógica de estado vive en la BD.
 * Implementa PaymentGateway para ser reemplazable por Stripe/MercadoPago.
 */
export class ManualPaymentService implements PaymentGateway {
  readonly name = 'manual'

  async createPaymentIntent(params: CreatePaymentParams): Promise<PaymentIntent> {
    // En flujo manual, el "intent" simplemente registra la intención
    // y queda pendiente de verificación por un supervisor/dueño.
    return {
      id: `manual_${params.pedidoId}_${Date.now()}`,
      amount: params.amount,
      currency: params.currency,
      status: 'pendiente_verificacion',
      referencia: params.referencia,
      metadata: {
        pedidoId: params.pedidoId,
        restauranteId: params.restauranteId,
        metodoPago: params.metodoPago,
        ...params.metadata,
      },
      createdAt: new Date().toISOString(),
    }
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<PaymentStatus> {
    // En flujo manual, la verificación la hace un humano (supervisor/dueño)
    // a través del endpoint PATCH /api/pedidos/[id]/pago
    // Este método es un stub para cumplir la interfaz.
    console.log(`[ManualPayment] Verificación solicitada para pedido ${params.pedidoId}`)
    return 'pendiente_verificacion'
  }

  async refund(_params: RefundParams): Promise<void> {
    // Reembolso manual: solo registra la solicitud en logs.
    // Una pasarela real implementaría el reverso del cargo.
    console.log(`[ManualPayment] Reembolso solicitado para pedido ${_params.pedidoId}`)
  }
}
