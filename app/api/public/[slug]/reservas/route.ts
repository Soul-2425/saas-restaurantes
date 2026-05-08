import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/api'
import { createAdminClient } from '@/lib/supabase/server'

// POST /api/public/[slug]/reservas — Public reservation, no auth required
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await req.json()

    const { nombre_cliente, email_cliente, telefono_cliente, fecha, hora, personas, notas } = body

    if (!nombre_cliente || !email_cliente || !fecha || !hora || !personas) {
      return apiError('Faltan campos obligatorios: nombre, email, fecha, hora y personas.', 400)
    }

    const admin = await createAdminClient()

    // Get restaurant by slug
    const { data: restaurante, error: rErr } = await admin
      .from('restaurantes')
      .select('id, nombre, estado_suscripcion')
      .eq('slug', slug)
      .single()

    if (rErr || !restaurante) return apiError('Restaurante no encontrado', 404)
    if (restaurante.estado_suscripcion !== 'activo') return apiError('Este restaurante no está disponible', 403)

    // Insert reservation
    const { data: reserva, error: insErr } = await admin
      .from('reservas')
      .insert({
        restaurante_id: restaurante.id,
        nombre_cliente,
        email_cliente,
        telefono_cliente: telefono_cliente ?? null,
        fecha,
        hora,
        personas: Number(personas),
        notas: notas ?? null,
        estado: 'pendiente',
      })
      .select()
      .single()

    if (insErr) return apiError(insErr.message, 500)

    return apiSuccess(reserva, { message: '¡Reserva enviada! Pronto recibirás una confirmación.' }, 201)
  } catch {
    return apiError('Error interno del servidor', 500)
  }
}
