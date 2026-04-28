import { NextRequest } from 'next/server'
import { apiSuccess, apiError, getAuthUser } from '@/lib/api'
import { UpdateProductoSchema } from '@/lib/validators'
import { ZodError } from 'zod'

type Params = { params: Promise<{ id: string }> }

// GET /api/productos/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const { user, supabase } = await getAuthUser()
    if (!user) return apiError('No autenticado', 401)

    const { data, error } = await supabase.from('productos').select('*').eq('id', id).single()
    if (error || !data) return apiError('Producto no encontrado', 404)
    return apiSuccess(data)
  } catch {
    return apiError('Error interno del servidor', 500)
  }
}

// PATCH /api/productos/[id]
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const { user, supabase } = await getAuthUser()
    if (!user) return apiError('No autenticado', 401)

    const body = await request.json()
    const validated = UpdateProductoSchema.parse(body)

    const { data, error } = await supabase
      .from('productos')
      .update(validated)
      .eq('id', id)
      .select()
      .single()

    if (error) return apiError(error.message, 500)
    return apiSuccess(data)
  } catch (err) {
    if (err instanceof ZodError) return apiError(err.issues[0].message, 422)
    return apiError('Error interno del servidor', 500)
  }
}

// DELETE /api/productos/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const { user, supabase } = await getAuthUser()
    if (!user) return apiError('No autenticado', 401)

    const { error } = await supabase.from('productos').delete().eq('id', id)
    if (error) return apiError(error.message, 500)
    return apiSuccess({ message: 'Producto eliminado.' })
  } catch {
    return apiError('Error interno del servidor', 500)
  }
}
