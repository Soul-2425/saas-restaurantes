import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from './supabase/server'

// ─── Tipo estándar de respuesta de API ─────────────────────────────────────
export type ApiResponse<T = unknown> = {
  data: T | null
  error: string | null
  meta?: Record<string, unknown>
}

// ─── Helpers de respuesta ───────────────────────────────────────────────────
export function apiSuccess<T>(
  data: T,
  meta?: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json<ApiResponse<T>>({ data, error: null, meta }, { status })
}

export function apiError(message: string, status = 400) {
  return NextResponse.json<ApiResponse<null>>(
    { data: null, error: message },
    { status }
  )
}

// ─── Obtiene usuario autenticado desde la sesión ────────────────────────────
export async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { user: null, supabase }
  return { user, supabase }
}

// ─── Verifica que el usuario pertenezca al tenant y tenga el rol requerido ──
export async function verifyTenantAccess(
  restauranteId: string,
  userId: string,
  roles?: Array<'dueño' | 'supervisor' | 'empleado'>
) {
  const supabase = await createAdminClient()

  // SUPERADMIN BYPASS (Programadores)
  const SUPERADMIN_EMAILS = ['solcarsaro1111@gmail.com', 'admin@therosegroup.com']
  const { data: userData } = await supabase.from('usuarios').select('email').eq('id', userId).single()
  
  if (userData && SUPERADMIN_EMAILS.includes(userData.email)) {
    return { allowed: true, rol: 'dueño' } // Superadmin actúa como dueño en todas las vistas
  }

  const { data, error } = await supabase
    .from('usuarios_restaurantes')
    .select('rol')
    .eq('usuario_id', userId)
    .eq('restaurante_id', restauranteId)
    .single()

  if (error || !data) {
    console.error('verifyTenantAccess FAILED:', { userId, restauranteId, error })
    return { allowed: false, rol: null }
  }
  if (roles && !roles.includes(data.rol as 'dueño' | 'supervisor' | 'empleado')) {
    return { allowed: false, rol: data.rol as string }
  }
  return { allowed: true, rol: data.rol as string }
}
