import { NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/api'
import { RegisterSchema } from '@/lib/validators'
import { ZodError } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, nombre } = RegisterSchema.parse(body)

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

    return apiSuccess(
      { user: { id: data.user.id, email, nombre } },
      { message: 'Revisa tu email para confirmar la cuenta.' },
      201
    )
  } catch (err) {
    if (err instanceof ZodError) return apiError(err.issues[0].message, 422)
    return apiError('Error interno del servidor', 500)
  }
}
