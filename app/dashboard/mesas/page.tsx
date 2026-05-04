'use client'

import { useEffect, useState } from 'react'
import { subscribeMesas } from '@/lib/realtime'
import { Modal } from '@/components/ui/modal'
import { Users, AlertCircle, Loader2 } from 'lucide-react'

interface Mesa {
  id: string
  restaurante_id: string
  numero: string
  capacidad: number
  estado: 'libre' | 'ocupada' | 'sucia'
}

export default function MesasPage() {
  const [mesas, setMesas] = useState<Mesa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [restauranteId, setRestauranteId] = useState<string | null>(null)
  
  // Modal state
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Load tenant and data
  useEffect(() => {
    let unsub: (() => void) | undefined

    const loadData = () => {
      const rId = localStorage.getItem('rg_sucursal')
      if (!rId) {
        setError('No hay sucursal seleccionada. Por favor selecciona una en el menú superior.')
        setLoading(false)
        return
      }
      
      setError('')
      setLoading(true)
      setRestauranteId(rId)

      fetch(`/api/mesas?restaurante_id=${rId}`)
        .then(r => r.json())
        .then(res => {
          if (res.error) throw new Error(res.error)
          setMesas(res.data || [])
          
          if (unsub) unsub()
          unsub = subscribeMesas(rId, (payload) => {
            setMesas(prev => {
              if (payload.eventType === 'INSERT') return [...prev, payload.new as Mesa]
              if (payload.eventType === 'DELETE') return prev.filter(m => m.id !== payload.old.id)
              const updated = payload.new as Mesa
              return prev.map(m => m.id === updated.id ? updated : m)
            })
          })
        })
        .catch(e => setError(e.message))
        .finally(() => setLoading(false))
    }

    loadData()
    window.addEventListener('tenant_changed', loadData)

    return () => {
      window.removeEventListener('tenant_changed', loadData)
      if (unsub) unsub()
    }
  }, [])

  const openMesa = (mesa: Mesa) => {
    setSelectedMesa(mesa)
    setIsModalOpen(true)
  }

  // Helper for colors
  const getStyleForEstado = (estado: string) => {
    switch (estado) {
      case 'ocupada':
        return { bg: 'var(--red-glow)', border: 'var(--red-border)', color: 'var(--red-light)', shadow: 'var(--shadow-red)' }
      case 'sucia':
        return { bg: 'var(--gold-glow)', border: 'var(--border-gold)', color: 'var(--gold-light)', shadow: 'var(--shadow-gold)' }
      default: // libre
        return { bg: 'var(--surface-2)', border: 'var(--border)', color: 'var(--text-1)', shadow: 'none' }
    }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader2 className="animate-spin text-red" size={32} /></div>
  if (error) return <div className="card text-red bg-red-glow border-red-border">{error}</div>

  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '0.25rem' }}>
            Control de Mesas
          </h1>
          <p style={{ color: 'var(--text-3)', fontSize: '0.9rem' }}>
            Vista en tiempo real de la ocupación del restaurante.
          </p>
        </div>
        
        {/* Leyenda */}
        <div style={{ display: 'flex', gap: '1rem', background: 'var(--surface-1)', padding: '0.5rem 1rem', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-2)' }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--surface-2)', border: '1px solid var(--border)' }} /> Libre
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--red-light)' }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--red-glow)', border: '1px solid var(--red-border)' }} /> Ocupada
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--gold-light)' }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--gold-glow)', border: '1px solid var(--border-gold)' }} /> Sucia
          </div>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', 
        gap: '1rem' 
      }}>
        {mesas.map(mesa => {
          const style = getStyleForEstado(mesa.estado)
          return (
            <button
              key={mesa.id}
              onClick={() => openMesa(mesa)}
              style={{
                background: style.bg,
                border: `1px solid ${style.border}`,
                borderRadius: 'var(--r-md)',
                padding: '1.25rem 1rem',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                cursor: 'pointer', transition: 'all var(--t-base)',
                boxShadow: mesa.estado !== 'libre' ? style.shadow : 'var(--shadow-sm)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
            >
              <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.5rem', fontWeight: 700, color: style.color, lineHeight: 1 }}>
                {mesa.numero}
              </h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-3)', fontSize: '0.75rem' }}>
                <Users size={12} /> {mesa.capacidad} pax
              </div>
              
              {mesa.estado === 'sucia' && (
                <div style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--gold-light)', fontSize: '0.7rem', fontWeight: 600 }}>
                  <AlertCircle size={12} /> Limpiar
                </div>
              )}
            </button>
          )
        })}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={`Mesa ${selectedMesa?.numero}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>
            Estado actual: <span style={{ fontWeight: 600, color: getStyleForEstado(selectedMesa?.estado || 'libre').color, textTransform: 'capitalize' }}>{selectedMesa?.estado}</span>
          </p>
          
          <div className="divider" style={{ margin: '0.5rem 0' }} />
          
          <h4 style={{ color: 'var(--text-1)', fontSize: '0.95rem', fontWeight: 600 }}>Acciones</h4>
          
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {selectedMesa?.estado === 'libre' ? (
              <button className="btn btn-red" style={{ flex: 1 }}>Abrir Pedido</button>
            ) : (
              <button className="btn btn-red" style={{ flex: 1 }}>Ver Pedido Activo</button>
            )}
            
            {selectedMesa?.estado === 'sucia' && (
              <button className="btn btn-gold" style={{ flex: 1 }}>Marcar como Libre</button>
            )}
            {selectedMesa?.estado === 'ocupada' && (
               <button className="btn btn-ghost" style={{ flex: 1 }}>Ver Detalles</button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
