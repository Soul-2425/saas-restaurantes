'use client'

import { createClient } from './supabase/client'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export type RealtimeTable = 'mesas' | 'pedidos' | 'pedidos_items' | 'reservas'

type ChangeHandler = (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void

export interface TenantChannelOptions {
  restauranteId: string
  tables: RealtimeTable[]
  onInsert?: ChangeHandler
  onUpdate?: ChangeHandler
  onDelete?: ChangeHandler
}

/**
 * Suscribe a cambios en tiempo real de las tablas operativas de un tenant.
 * Retorna una función de cleanup para cancelar la suscripción.
 *
 * @example
 * const unsub = subscribeTenantRealtime({
 *   restauranteId: 'xxx',
 *   tables: ['mesas', 'pedidos'],
 *   onUpdate: (p) => console.log('Actualización:', p),
 * })
 * // En cleanup: unsub()
 */
export function subscribeTenantRealtime(options: TenantChannelOptions) {
  const { restauranteId, tables, onInsert, onUpdate, onDelete } = options
  const supabase = createClient()
  const channelName = `tenant-${restauranteId}`

  let channel = supabase.channel(channelName)

  for (const table of tables) {
    channel = channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter: `restaurante_id=eq.${restauranteId}`,
      },
      (payload) => {
        if (payload.eventType === 'INSERT' && onInsert) onInsert(payload)
        if (payload.eventType === 'UPDATE' && onUpdate) onUpdate(payload)
        if (payload.eventType === 'DELETE' && onDelete) onDelete(payload)
      }
    )
  }

  channel.subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

/**
 * Suscripción específica para pedidos abiertos de un tenant.
 */
export function subscribePedidosActivos(
  restauranteId: string,
  handlers: { onInsert?: ChangeHandler; onUpdate?: ChangeHandler; onDelete?: ChangeHandler }
) {
  return subscribeTenantRealtime({
    restauranteId,
    tables: ['pedidos', 'pedidos_items'],
    ...handlers,
  })
}

/**
 * Suscripción específica al estado de las mesas de un tenant.
 */
export function subscribeMesas(restauranteId: string, onUpdate: ChangeHandler) {
  return subscribeTenantRealtime({
    restauranteId,
    tables: ['mesas'],
    onUpdate,
  })
}
