'use client'

import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Loader2, PackageSearch, Plus, Package, Clock, Archive } from 'lucide-react'

interface Producto {
  id: string
  restaurante_id: string
  nombre: string
  precio: number
  stock: number
  categoria: string | null
  es_por_tiempo: boolean
}

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [restauranteId, setRestauranteId] = useState<string | null>(null)
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    precio: '',
    stock: '0',
    categoria: '',
    es_por_tiempo: false
  })

  // Load tenant and data
  useEffect(() => {
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

      fetch(`/api/productos?restaurante_id=${rId}`)
        .then(r => r.json())
        .then(res => {
          if (res.error) throw new Error(res.error)
          setProductos(res.data || [])
        })
        .catch(e => setError(e.message))
        .finally(() => setLoading(false))
    }

    loadData()
    window.addEventListener('tenant_changed', loadData)
    return () => window.removeEventListener('tenant_changed', loadData)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restauranteId) return
    setIsSubmitting(true)
    setError('')

    try {
      const payload = {
        restaurante_id: restauranteId,
        nombre: formData.nombre,
        precio: parseFloat(formData.precio),
        stock: parseInt(formData.stock, 10),
        categoria: formData.categoria || null,
        es_por_tiempo: formData.es_por_tiempo
      }

      const res = await fetch('/api/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Error al guardar el producto')
      
      // Update local state
      setProductos(prev => [...prev, data.data].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      setIsModalOpen(false)
      setFormData({ nombre: '', precio: '', stock: '0', categoria: '', es_por_tiempo: false })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Agrupar por categorías para una mejor vista
  const categorias = Array.from(new Set(productos.map(p => p.categoria || 'Sin categoría')))

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader2 className="animate-spin text-red" size={32} /></div>
  
  // Omitimos el full render de error para que permita ver la UI al menos, pero mostramos el banner
  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '0.25rem' }}>
            Productos e Inventario
          </h1>
          <p style={{ color: 'var(--text-3)', fontSize: '0.9rem' }}>
            Gestiona el menú, inventario físico y cobros por tiempo (ej. Billar).
          </p>
        </div>
        
        <button onClick={() => setIsModalOpen(true)} className="btn btn-red" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} /> Nuevo Producto
        </button>
      </div>

      {error && <div className="card text-red bg-red-glow border-red-border" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      {productos.length === 0 && !error ? (
        <div style={{
          padding: '4rem 2rem', textAlign: 'center', background: 'var(--surface-1)',
          border: '1px dashed var(--border)', borderRadius: 'var(--r-lg)'
        }}>
          <PackageSearch size={48} style={{ color: 'var(--text-3)', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-1)', fontWeight: 600, marginBottom: '0.5rem' }}>No hay productos registrados</h3>
          <p style={{ color: 'var(--text-3)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Comienza agregando platillos, bebidas o servicios a tu catálogo.</p>
          <button onClick={() => setIsModalOpen(true)} className="btn btn-ghost" style={{ margin: '0 auto' }}>
            Crear mi primer producto
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {categorias.map(cat => (
            <div key={cat}>
              <h2 style={{ 
                fontSize: '1rem', fontWeight: 600, color: 'var(--gold-light)', 
                marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em',
                display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)' }} />
                {cat}
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                {productos.filter(p => (p.categoria || 'Sin categoría') === cat).map(p => (
                  <div key={p.id} className="card" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-1)' }}>{p.nombre}</h3>
                      {p.es_por_tiempo ? (
                        <span title="Cobro por tiempo"><Clock size={16} style={{ color: 'var(--gold-light)' }} /></span>
                      ) : (
                        <span title="Producto físico"><Package size={16} style={{ color: 'var(--text-3)' }} /></span>
                      )}
                    </div>
                    
                    <p style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--red-light)', marginBottom: '1rem' }}>
                      ${p.precio.toFixed(2)}
                    </p>
                    
                    {!p.es_por_tiempo && (
                      <div style={{ 
                        display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem',
                        color: p.stock <= 5 ? 'var(--red-light)' : 'var(--text-2)',
                        background: p.stock <= 5 ? 'var(--red-glow)' : 'var(--surface-2)',
                        padding: '0.35rem 0.6rem', borderRadius: 'var(--r-sm)', width: 'max-content'
                      }}>
                        <Archive size={13} /> Stock: {p.stock}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear Producto */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Nuevo Producto"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-2)', marginBottom: '0.4rem' }}>Nombre del producto *</label>
            <input 
              type="text" required placeholder="Ej. Hamburguesa Clásica"
              value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-2)', marginBottom: '0.4rem' }}>Precio (USD) *</label>
              <input 
                type="number" step="0.01" min="0" required placeholder="0.00"
                value={formData.precio} onChange={e => setFormData({...formData, precio: e.target.value})}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-2)', marginBottom: '0.4rem' }}>Categoría</label>
              <input 
                type="text" placeholder="Ej. Platos Fuertes"
                value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ 
            background: 'var(--surface-2)', border: '1px solid var(--border)', 
            padding: '1rem', borderRadius: 'var(--r-sm)', display: 'flex', flexDirection: 'column', gap: '1rem' 
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={formData.es_por_tiempo}
                onChange={e => setFormData({...formData, es_por_tiempo: e.target.checked})}
                style={{ width: 16, height: 16, accentColor: 'var(--red)' }}
              />
              <div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-1)', fontWeight: 500 }}>Cobro por tiempo</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Ideal para mesas de billar (se cobra por minuto/hora).</p>
              </div>
            </label>

            {!formData.es_por_tiempo && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-2)', marginBottom: '0.4rem' }}>Stock Inicial</label>
                <input 
                  type="number" min="0" required={!formData.es_por_tiempo}
                  value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})}
                  style={{ width: '100px' }}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-red" style={{ width: 120 }}>
              {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Guardar'}
            </button>
          </div>

        </form>
      </Modal>

    </div>
  )
}
