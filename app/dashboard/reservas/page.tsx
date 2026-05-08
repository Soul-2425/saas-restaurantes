'use client'

import { useEffect, useState } from 'react'
import { subscribeReservas } from '@/lib/realtime'
import { Modal } from '@/components/ui/modal'
import { Calendar, Users, Loader2, Clock, CheckCircle, XCircle } from 'lucide-react'

interface Mesa {
  id: string
  numero: string
}

interface Reserva {
  id: string
  restaurante_id: string
  mesa_id?: string
  cliente_nombre: string
  cantidad_personas: number
  fecha_hora: string
  estado: 'pendiente' | 'confirmada' | 'cancelada' | 'completada'
  mesas?: { numero: string }
}

export default function ReservasPage() {
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [mesas, setMesas] = useState<Mesa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [restauranteId, setRestauranteId] = useState<string | null>(null)
  
  // Modal states
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    cliente_nombre: '',
    cantidad_personas: 2,
    fecha: new Date().toISOString().split('T')[0],
    hora: '19:00',
    mesa_id: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = () => {
    const rId = localStorage.getItem('rg_sucursal')
    if (!rId) {
      setError('No tienes ninguna sucursal seleccionada.')
      setLoading(false)
      return
    }
    
    setError('')
    setLoading(true)
    setRestauranteId(rId)

    Promise.all([
      fetch(`/api/reservas?restaurante_id=${rId}`).then(r => r.json()),
      fetch(`/api/mesas?restaurante_id=${rId}`).then(r => r.json())
    ])
    .then(([resRes, mesasRes]) => {
      if (resRes.error) throw new Error(resRes.error)
      if (mesasRes.error) throw new Error(mesasRes.error)
      
      setReservas(resRes.data || [])
      setMesas(mesasRes.data || [])
    })
    .catch(e => setError(e.message))
    .finally(() => setLoading(false))
  }

  useEffect(() => {
    let unsub: (() => void) | undefined

    loadData()
    window.addEventListener('tenant_changed', loadData)

    const rId = localStorage.getItem('rg_sucursal')
    if (rId) {
      unsub = subscribeReservas(rId, (payload) => {
        // En lugar de hacer diff manual complejo que puede perder los joins (mesas.numero), recargamos los datos para mantener consistencia.
        // Podríamos optimizarlo, pero recargar asegura que siempre traemos el nombre de la mesa unida.
        loadData()
      })
    }

    return () => {
      window.removeEventListener('tenant_changed', loadData)
      if (unsub) unsub()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restauranteId) return
    setIsSubmitting(true)

    // Combinar fecha y hora
    const fechaHora = new Date(`${formData.fecha}T${formData.hora}:00`).toISOString()

    const payload = {
      restaurante_id: restauranteId,
      cliente_nombre: formData.cliente_nombre,
      cantidad_personas: formData.cantidad_personas,
      fecha_hora: fechaHora,
      ...(formData.mesa_id ? { mesa_id: formData.mesa_id } : {})
    }

    try {
      const res = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al crear reserva')
      }
      setIsNewModalOpen(false)
      setFormData({ ...formData, cliente_nombre: '' })
      loadData()
    } catch (err: any) {
      window.alert(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateStatus = async (estado: string) => {
    if (!selectedReserva) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/reservas/${selectedReserva.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al actualizar reserva')
      }
      setIsViewModalOpen(false)
      loadData()
    } catch (err: any) {
      window.alert(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStyleForEstado = (estado: string) => {
    switch (estado) {
      case 'pendiente': return { color: 'var(--gold-light)', bg: 'var(--gold-glow)', border: 'var(--border-gold)' }
      case 'confirmada': return { color: 'var(--red-light)', bg: 'var(--red-glow)', border: 'var(--red-border)' }
      case 'completada': return { color: 'var(--text-2)', bg: 'var(--surface-2)', border: 'var(--border)' }
      case 'cancelada': return { color: 'var(--text-3)', bg: 'var(--surface-1)', border: 'var(--border)' }
      default: return { color: 'var(--text-1)', bg: 'var(--surface-2)', border: 'var(--border)' }
    }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader2 className="animate-spin text-red" size={32} /></div>
  if (error) return <div className="card text-red bg-red-glow border-red-border">{error}</div>

  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '0.25rem' }}>
            Reservas
          </h1>
          <p style={{ color: 'var(--text-3)', fontSize: '0.9rem' }}>
            Gestiona los turnos y agendamientos de clientes.
          </p>
        </div>
        
        <button className="btn btn-red" onClick={() => setIsNewModalOpen(true)}>
          + Nueva Reserva
        </button>
      </div>

      {reservas.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)', background: 'var(--surface-1)', borderRadius: 'var(--r-lg)', border: '1px dashed var(--border)' }}>
          No hay reservas registradas.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {reservas.map(reserva => {
            const style = getStyleForEstado(reserva.estado)
            const isPast = new Date(reserva.fecha_hora) < new Date() && reserva.estado === 'pendiente'

            return (
              <button
                key={reserva.id}
                onClick={() => { setSelectedReserva(reserva); setIsViewModalOpen(true); }}
                style={{
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-md)',
                  padding: '1.25rem 1rem',
                  display: 'flex', flexDirection: 'column', gap: '0.75rem',
                  cursor: 'pointer', textAlign: 'left', transition: 'all var(--t-fast)'
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--text-3)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-1)', lineHeight: 1.2 }}>
                    {reserva.cliente_nombre}
                  </h3>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: style.color, background: style.bg, border: `1px solid ${style.border}`, padding: '0.15rem 0.5rem', borderRadius: 'var(--r-full)', textTransform: 'capitalize' }}>
                    {reserva.estado}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={13} style={{ color: isPast ? 'var(--red-light)' : 'var(--text-3)' }} />
                    <span style={{ color: isPast ? 'var(--red-light)' : 'inherit' }}>
                      {new Date(reserva.fecha_hora).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Users size={13} style={{ color: 'var(--text-3)' }} />
                    {reserva.cantidad_personas} pax
                  </div>
                </div>

                {reserva.mesas?.numero && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', background: 'var(--surface-2)', padding: '0.25rem 0.5rem', borderRadius: 'var(--r-xs)', alignSelf: 'flex-start' }}>
                    Mesa {reserva.mesas.numero}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* MODAL CREAR */}
      <Modal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} title="Nueva Reserva">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div>
            <label className="text-sm font-medium text-2 mb-2 block">Nombre del Cliente</label>
            <input 
              type="text" required className="input" placeholder="Ej. Juan Pérez"
              value={formData.cliente_nombre} onChange={e => setFormData({...formData, cliente_nombre: e.target.value})}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label className="text-sm font-medium text-2 mb-2 block">Fecha</label>
              <input 
                type="date" required className="input"
                value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="text-sm font-medium text-2 mb-2 block">Hora</label>
              <input 
                type="time" required className="input"
                value={formData.hora} onChange={e => setFormData({...formData, hora: e.target.value})}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label className="text-sm font-medium text-2 mb-2 block">Personas</label>
              <input 
                type="number" min="1" required className="input"
                value={formData.cantidad_personas} onChange={e => setFormData({...formData, cantidad_personas: parseInt(e.target.value)})}
              />
            </div>
            <div style={{ flex: 2 }}>
              <label className="text-sm font-medium text-2 mb-2 block">Asignar Mesa (Opcional)</label>
              <select className="input" value={formData.mesa_id} onChange={e => setFormData({...formData, mesa_id: e.target.value})}>
                <option value="">Sin mesa asignada</option>
                {mesas.map(m => (
                  <option key={m.id} value={m.id}>Mesa {m.numero}</option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-red" style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Guardar Reserva'}
          </button>
        </form>
      </Modal>

      {/* MODAL VER/EDITAR ESTADO */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={`Reserva: ${selectedReserva?.cliente_nombre}`}>
        {selectedReserva && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'var(--surface-2)', padding: '1rem', borderRadius: 'var(--r-md)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--text-3)', display: 'block', marginBottom: '0.2rem' }}>Fecha y Hora</span>
                  <span style={{ color: 'var(--text-1)', fontWeight: 500 }}>{new Date(selectedReserva.fecha_hora).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-3)', display: 'block', marginBottom: '0.2rem' }}>Personas</span>
                  <span style={{ color: 'var(--text-1)', fontWeight: 500 }}>{selectedReserva.cantidad_personas} pax</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-3)', display: 'block', marginBottom: '0.2rem' }}>Mesa Asignada</span>
                  <span style={{ color: 'var(--text-1)', fontWeight: 500 }}>{selectedReserva.mesas?.numero || 'Ninguna'}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-3)', display: 'block', marginBottom: '0.2rem' }}>Estado Actual</span>
                  <span style={{ color: getStyleForEstado(selectedReserva.estado).color, fontWeight: 600, textTransform: 'capitalize' }}>{selectedReserva.estado}</span>
                </div>
              </div>
            </div>

            <h4 style={{ color: 'var(--text-1)', fontSize: '0.95rem', fontWeight: 600, marginTop: '0.5rem' }}>Actualizar Estado</h4>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {selectedReserva.estado === 'pendiente' && (
                <button onClick={() => handleUpdateStatus('confirmada')} className="btn btn-red" style={{ flex: 1 }} disabled={isSubmitting}>
                  <CheckCircle size={14} /> Confirmar
                </button>
              )}
              {(selectedReserva.estado === 'pendiente' || selectedReserva.estado === 'confirmada') && (
                <button onClick={() => handleUpdateStatus('completada')} className="btn btn-gold" style={{ flex: 1 }} disabled={isSubmitting}>
                  <CheckCircle size={14} /> Completar
                </button>
              )}
              {selectedReserva.estado !== 'cancelada' && selectedReserva.estado !== 'completada' && (
                <button onClick={() => handleUpdateStatus('cancelada')} className="btn btn-ghost" style={{ flex: 1 }} disabled={isSubmitting}>
                  <XCircle size={14} /> Cancelar
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
