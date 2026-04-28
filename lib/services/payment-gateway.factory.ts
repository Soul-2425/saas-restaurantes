import type { PaymentGateway } from './payment.interface'
import { ManualPaymentService } from './manual-payment.service'

/**
 * Factory que retorna la implementación correcta de PaymentGateway
 * según la configuración del tenant o variable de entorno.
 *
 * Para agregar Stripe:
 *   1. Crear StripePaymentService implements PaymentGateway
 *   2. Agregar case 'stripe' aquí
 *
 * Para Mercado Pago:
 *   1. Crear MercadoPagoPaymentService implements PaymentGateway
 *   2. Agregar case 'mercadopago' aquí
 */
export class PaymentGatewayFactory {
  static create(gateway?: string): PaymentGateway {
    const selected = gateway ?? process.env.PAYMENT_GATEWAY ?? 'manual'

    switch (selected) {
      case 'manual':
        return new ManualPaymentService()

      // case 'stripe':
      //   return new StripePaymentService(process.env.STRIPE_SECRET_KEY!)

      // case 'mercadopago':
      //   return new MercadoPagoPaymentService(process.env.MP_ACCESS_TOKEN!)

      default:
        console.warn(`[PaymentGatewayFactory] Gateway "${selected}" no reconocido. Usando flujo manual.`)
        return new ManualPaymentService()
    }
  }
}
