import { NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/api'
import { RegisterSchema } from '@/lib/validators'
import { ZodError } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, nombre, restauranteNombre } = RegisterSchema.parse(body)

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) return apiError(error.message, 400)
    if (!data.user) return apiError('No se pudo crear el usuario', 500)

    // Insertar en public.usuarios usando admin client (bypassa RLS durante registro)
    const adminClient = await createAdminClient()
    const { error: insertError } = await adminClient
      .from('usuarios')
      .insert({ id: data.user.id, email, nombre })

    if (insertError) return apiError(insertError.message, 500)

    let restauranteInfo = null

    // Si se proporcionó el nombre del restaurante, crear el Tenant y asociarlo
    if (restauranteNombre) {
      const slug = restauranteNombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      
      const { data: restaurante, error: rError } = await adminClient
        .from('restaurantes')
        .insert({ nombre: restauranteNombre, slug })
        .select('id')
        .single()
        
      if (rError) {
        // Log the error but don't fail user creation, they can create tenant later if needed
        console.error('Error al crear restaurante:', rError.message)
      } else if (restaurante) {
        // Crear el vínculo como Dueño
        await adminClient
          .from('usuarios_restaurantes')
          .insert({
            usuario_id: data.user.id,
            restaurante_id: restaurante.id,
            rol: 'dueño'
          })
          
        restauranteInfo = restaurante
      }
    }

    return apiSuccess(
      { 
        user: { id: data.user.id, email, nombre },
        restaurante_id: restauranteInfo?.id || null 
      },
      { message: 'Cuenta creada exitosamente.' },
      201
    )
  } catch (err) {
    if (err instanceof ZodError) return apiError(err.issues[0].message, 422)
    return apiError('Error interno del servidor', 500)
  }
}
