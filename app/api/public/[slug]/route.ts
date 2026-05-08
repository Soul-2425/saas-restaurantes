import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/api'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/public/[slug] — Public endpoint, no auth required
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const admin = await createAdminClient()

    // Get restaurant by slug
    const { data: restaurante, error: rErr } = await admin
      .from('restaurantes')
      .select('id, nombre, slug, estado_suscripcion')
      .eq('slug', slug)
      .single()

    if (rErr || !restaurante) return apiError('Restaurante no encontrado', 404)
    if (restaurante.estado_suscripcion !== 'activo') return apiError('Este restaurante no está disponible', 403)

    // Get products (menu) — only active ones
    const { data: productos } = await admin
      .from('productos')
      .select('id, nombre, descripcion, precio, categoria, es_por_tiempo, disponible')
      .eq('restaurante_id', restaurante.id)
      .eq('disponible', true)
      .order('categoria')
      .order('nombre')

    return apiSuccess({
      restaurante,
      productos: productos ?? [],
    })
  } catch {
    return apiError('Error interno del servidor', 500)
  }
}
