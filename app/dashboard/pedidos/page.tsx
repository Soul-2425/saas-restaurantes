'use client'

import { useEffect, useState } from 'react'
import { subscribePedidosActivos } from '@/lib/realtime'
import { Modal } from '@/components/ui/modal'
import { Clock, CheckCircle2, ChevronRight, Loader2, Receipt } from 'lucide-react'

interface Pedido {
  id: string
  restaurante_id: string
  mesa_id: string | null
  usuario_id: string
  estado: 'pendiente' | 'preparacion' | 'listo' | 'servido' | 'pagado'
  total: string
  creado_en: string
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [restauranteId, setRestauranteId] = useState<string | null>(null)
  
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null)
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

      fetch(`/api/pedidos?restaurante_id=${rId}`)
        .then(r => r.json())
        .then(res => {
          if (res.error) throw new Error(res.error)
          const allPedidos = res.data || []
          const active = allPedidos.filter((p: Pedido) => p.restaurante_id === rId && p.estado !== 'pagado')
          setPedidos(active)

          if (unsub) unsub()
          unsub = subscribePedidosActivos(rId, {
            onInsert: (payload) => {
              const p = payload.new as unknown as Pedido
              if (p.estado !== 'pagado') setPedidos(prev => [p, ...prev])
            },
            onUpdate: (payload) => {
              const p = payload.new as unknown as Pedido
              setPedidos(prev => {
                if (p.estado === 'pagado') return prev.filter(item => item.id !== p.id)
                const exists = prev.find(item => item.id === p.id)
                if (exists) return prev.map(item => item.id === p.id ? p : item)
                return [p, ...prev]
              })
            },
            onDelete: (payload) => {
              const oldP = payload.old as unknown as Partial<Pedido>
              setPedidos(prev => prev.filter(p => p.id !== oldP.id))
            }
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

  const openPedido = (pedido: Pedido) => {
    setSelectedPedido(pedido)
    setIsModalOpen(true)
  }

  // Format date helper
  const formatTime = (isoString: string) => {
    const d = new Date(isoString)
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }

  // Group pedidos by estado
  const columns = [
    { id: 'pendiente', label: 'Pendiente', color: 'var(--text-1)', bg: 'var(--surface-2)', border: 'var(--border)' },
    { id: 'preparacion', label: 'En Preparación', color: 'var(--gold-light)', bg: 'var(--gold-glow)', border: 'var(--border-gold)' },
    { id: 'listo', label: 'Listo para Servir', color: 'var(--red-light)', bg: 'var(--red-glow)', border: 'var(--red-border)' },
  ]

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader2 className="animate-spin text-red" size={32} /></div>
  if (error) return <div className="card text-red bg-red-glow border-red-border">{error}</div>

  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '0.25rem' }}>
          Pedidos Activos
        </h1>
        <p style={{ color: 'var(--text-3)', fontSize: '0.9rem' }}>
          Tablero Kanban en tiempo real para cocina y sala.
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '1.5rem',
        alignItems: 'start'
      }}>
        {columns.map(col => {
          const colPedidos = pedidos.filter(p => p.estado === col.id)
          return (
            <div key={col.id} style={{ 
              background: 'var(--surface-1)', 
              borderRadius: 'var(--r-md)', 
              border: `1px solid var(--border)`,
              display: 'flex', flexDirection: 'column',
              maxHeight: 'calc(100vh - 200px)'
            }}>
              {/* Header */}
              <div style={{ 
                padding: '1rem', 
                borderBottom: `1px solid var(--border)`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <h2 style={{ fontSize: '0.9rem', fontWeight: 600, color: col.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {col.label}
                </h2>
                <span style={{ 
                  background: col.bg, color: col.color, border: `1px solid ${col.border}`,
                  padding: '0.15rem 0.6rem', borderRadius: 99, fontSize: '0.75rem', fontWeight: 700 
                }}>
                  {colPedidos.length}
                </span>
              </div>
              
              {/* List */}
              <div style={{ padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {colPedidos.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: '0.85rem', padding: '2rem 0' }}>No hay pedidos</p>
                ) : (
                  colPedidos.map(p => (
                    <div key={p.id} onClick={() => openPedido(p)} style={{
                      background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
                      padding: '1rem', cursor: 'pointer', transition: 'all var(--t-fast)'
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = col.border; (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 12px ${col.bg}` }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-1)' }}>
                          ID: {p.id.slice(0, 8)}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} /> {formatTime(p.creado_en)}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Receipt size={14} /> Total: ${p.total}
                        </span>
                        <ChevronRight size={16} style={{ color: 'var(--text-3)' }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={`Detalle de Pedido`}
      >
        {selectedPedido && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>ID Pedido</p>
                <p style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.1rem', color: 'var(--text-1)', fontWeight: 600 }}>{selectedPedido.id.split('-')[0]}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Total</p>
                <p style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.25rem', color: 'var(--gold-light)', fontWeight: 700 }}>${selectedPedido.total}</p>
              </div>
            </div>

            <div className="divider" style={{ margin: '0.5rem 0' }} />

            <h4 style={{ color: 'var(--text-1)', fontSize: '0.95rem', fontWeight: 600 }}>Avanzar Estado</h4>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {selectedPedido.estado === 'pendiente' && (
                <button className="btn btn-gold" style={{ flex: 1 }}>Mandar a Preparación</button>
              )}
              {selectedPedido.estado === 'preparacion' && (
                <button className="btn btn-red" style={{ flex: 1 }}>Marcar Listo para Servir</button>
              )}
              {selectedPedido.estado === 'listo' && (
                <button className="btn btn-ghost" style={{ flex: 1, color: 'var(--text-1)', borderColor: 'var(--border)' }}>
                  <CheckCircle2 size={16} /> Servido
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
