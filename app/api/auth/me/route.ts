import { apiSuccess, apiError, getAuthUser } from '@/lib/api'

export async function GET() {
  try {
    const { user, supabase } = await getAuthUser()
    if (!user) return apiError('No autenticado', 401)

    const [perfilRes, accesosRes] = await Promise.all([
      supabase.from('usuarios').select('nombre, email').eq('id', user.id).single(),
      supabase
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
