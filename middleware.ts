import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware global:
 * 1. Refresca la sesión de Supabase en cada request.
 * 2. Redirige a /login si el usuario no está autenticado en rutas protegidas.
 * 3. Verifica pertenencia a un restaurante_id para rutas /dashboard.
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresca sesión (NO usar getSession() — siempre getUser() por seguridad)
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isDashboard = pathname.startsWith('/dashboard')
  const isApi = pathname.startsWith('/api')

  // Rutas públicas que no requieren sesión
  const publicRoutes = ['/login', '/register', '/api/auth/login', '/api/auth/register']
  const isPublic = publicRoutes.some(r => pathname.startsWith(r))

  // Redirigir a login si no hay sesión en rutas protegidas
  if (!user && (isDashboard || (isApi && !isPublic))) {
    if (isDashboard) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      return NextResponse.redirect(loginUrl)
    }
    // Para rutas API devolver 401
    return NextResponse.json({ data: null, error: 'No autenticado' }, { status: 401 })
  }

  // Verificar acceso al tenant en rutas /dashboard/[restauranteId]/*
  if (user && isDashboard) {
    const segments = pathname.split('/').filter(Boolean)
    // Patrón: /dashboard/[restauranteId]/...
    const restauranteId = segments[1]
    if (restauranteId && restauranteId.length === 36) {
      const { data: acceso } = await supabase
        .from('usuarios_restaurantes')
        .select('rol')
        .eq('usuario_id', user.id)
        .eq('restaurante_id', restauranteId)
        .single()

      if (!acceso) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
      // Inyectar rol en headers para uso en Server Components
      supabaseResponse.headers.set('x-user-rol', acceso.rol)
      supabaseResponse.headers.set('x-restaurante-id', restauranteId)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
