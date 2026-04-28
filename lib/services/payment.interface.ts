// ─────────────────────────────────────────────────────────────────────────────
// Payment Gateway — Interfaces y Contrato
// Permite inyectar cualquier pasarela (Stripe, Mercado Pago, etc.) en el futuro
// sin cambiar los Route Handlers que usan estas interfaces.
// ─────────────────────────────────────────────────────────────────────────────

export type PaymentStatus =
  | 'sin_pago'
  | 'pendiente_verificacion'
  | 'pagado'
  | 'rechazado'

export type MetodoPago =
  | 'efectivo'
  | 'tarjeta'
  | 'transferencia'
  | 'cripto'
  | 'otro'

export interface PaymentIntent {
  id: string
  amount: string          // String para evitar pérdida de precisión en float
  currency: string        // ISO 4217 o código interno (USDT, VES, etc.)
  status: PaymentStatus
  referencia?: string
  metadata: Record<string, unknown>
  createdAt: string
}

export interface CreatePaymentParams {
  pedidoId: string
  restauranteId: string
  amount: string          // NUMERIC string — sin redondeo
  currency: string
  metodoPago: MetodoPago
  referencia?: string
  metadata?: Record<string, unknown>
}

export interface VerifyPaymentParams {
  pedidoId: string
  referencia: string
  gateway?: string        // Nombre de pasarela para routing
}

export interface RefundParams {
  pedidoId: string
  paymentId: string
  amount?: string         // Parcial si se indica
}

/**
 * Contrato que toda pasarela de pago debe implementar.
 * Inyectar a través del PaymentGatewayFactory.
 */
export interface PaymentGateway {
  readonly name: string

  /** Inicia un intento de cobro y retorna el intent. */
  createPaymentIntent(params: CreatePaymentParams): Promise<PaymentIntent>

  /** Verifica el estado de un pago por referencia. */
  verifyPayment(params: VerifyPaymentParams): Promise<PaymentStatus>

  /** Realiza un reembolso total o parcial. */
  refund(params: RefundParams): Promise<void>
}
