import { apiSuccess, apiError, getAuthUser } from '@/lib/api'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const { user } = await getAuthUser()
    if (!user) return apiError('No autenticado', 401)

    const adminClient = await createAdminClient()

    const [perfilRes, accesosRes] = await Promise.all([
      adminClient.from('usuarios').select('nombre, email').eq('id', user.id).single(),
      adminClient
        .from('usuarios_restaurantes')
        .select('restaurante_id, rol, restaurantes(id, nombre, slug, estado_suscripcion)')
        .eq('usuario_id', user.id),
    ])

    return apiSuccess({
      id: user.id,
      email: user.email,
      nombre: perfilRes.data?.nombre ?? null,
      accesos: accesosRes.data ?? [],
    })
  } catch {
    return apiError('Error interno del servidor', 500)
  }
}
