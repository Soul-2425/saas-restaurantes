'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Store, Check, Crown, ShieldCheck, User } from 'lucide-react'

interface Restaurante {
  id: string
  nombre: string
  slug: string
  estado_suscripcion: string
  rol: string
}

const rolIcons: Record<string, React.ReactNode> = {
  'dueño':      <Crown size={11} />,
  'supervisor': <ShieldCheck size={11} />,
  'empleado':   <User size={11} />,
}

const rolColors: Record<string, string> = {
  'dueño':      'var(--gold-light)',
  'supervisor': 'var(--red-light)',
  'empleado':   'var(--text-2)',
}

export function BranchSelector() {
  const [open, setOpen] = useState(false)
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([])
  const [current, setCurrent] = useState<Restaurante | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(r => r.json())
      .then(({ data }) => {
        if (!data?.accesos) return
        const list: Restaurante[] = data.accesos.map((a: { restaurantes: Omit<Restaurante, 'rol'>; rol: string }) => ({
          ...a.restaurantes, rol: a.rol,
        }))
        setRestaurantes(list)
        let saved = localStorage.getItem('rg_sucursal')
        if (saved === 'undefined' || saved === 'null') {
          saved = null
          localStorage.removeItem('rg_sucursal')
        }
        
        const found = list.find(r => r.id === saved) ?? list[0]
        if (found) {
          setCurrent(found)
          if (found.id !== saved) localStorage.setItem('rg_sucursal', found.id)
          window.dispatchEvent(new Event('tenant_changed'))
        }
      })
      .catch(() => null)
  }, [])

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const select = (r: Restaurante) => {
    setCurrent(r)
    localStorage.setItem('rg_sucursal', r.id)
    window.dispatchEvent(new Event('tenant_changed'))
    setOpen(false)
  }

  const handleCreate = async () => {
    const nombre = window.prompt('Ingresa el nombre de tu nuevo Local / Sucursal:')
    if (!nombre) return
    const slug = nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    try {
      const res = await fetch('/api/restaurantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, slug })
      })
      if (res.ok) {
        const { data } = await res.json()
        if (data?.id) {
          localStorage.setItem('rg_sucursal', data.id)
          window.location.reload()
        }
      } else {
        const errData = await res.json().catch(() => null)
        window.alert(`Error al crear el local: ${errData?.error || 'Revisa tu conexión'}`)
      }
    } catch (err) {
      window.alert('Error al crear el local.')
    }
  }

  if (!current) {
    if (restaurantes.length === 0) {
      return (
        <button 
          onClick={handleCreate}
          className="btn"
          style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'var(--red)', border: '1px solid var(--red-border)',
          borderRadius: 'var(--r-md)', padding: '0.45rem 0.75rem',
          color: '#fff', minWidth: 200, cursor: 'pointer', transition: 'all 0.2s'
        }}>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.2 }}>
              + Crear mi primer Local
            </p>
          </div>
        </button>
      )
    }
    return null
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: open ? 'var(--surface-2)' : 'var(--surface-1)',
          border: `1px solid ${open ? 'var(--red-border)' : 'var(--border)'}`,
          borderRadius: 'var(--r-md)', padding: '0.45rem 0.75rem',
          color: 'var(--text-1)', cursor: 'pointer', transition: 'all var(--t-base)',
          minWidth: 200,
        }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: 'var(--r-xs)',
          background: 'var(--red-glow)', border: '1px solid var(--red-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Store size={13} style={{ color: 'var(--red-light)' }} />
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-1)', lineHeight: 1.2 }}>
            {current.nombre}
          </p>
          <p style={{ fontSize: '0.65rem', color: rolColors[current.rol] ?? 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 3 }}>
            {rolIcons[current.rol]}
            {current.rol}
          </p>
        </div>
        <ChevronDown size={14} style={{ color: 'var(--text-3)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform var(--t-base)', flexShrink: 0 }} />
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0,
          background: 'var(--surface-1)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-lg)',
          minWidth: 240, zIndex: 200, overflow: 'hidden',
          animation: 'fadeUp 0.18s var(--ease) both',
        }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.6rem 0.75rem 0.4rem' }}>
            Mis sucursales
          </p>
          {restaurantes.map(r => (
            <button key={r.id} onClick={() => select(r)} style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              width: '100%', padding: '0.55rem 0.75rem',
              background: r.id === current.id ? 'var(--red-glow)' : 'transparent',
              border: 'none', cursor: 'pointer', textAlign: 'left',
              transition: 'background var(--t-fast)',
            }}
              onMouseEnter={e => { if (r.id !== current.id) (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)' }}
              onMouseLeave={e => { if (r.id !== current.id) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <div style={{
                width: 30, height: 30, borderRadius: 'var(--r-xs)',
                background: r.id === current.id ? 'var(--red-glow)' : 'var(--surface-3)',
                border: `1px solid ${r.id === current.id ? 'var(--red-border)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Store size={12} style={{ color: r.id === current.id ? 'var(--red-light)' : 'var(--text-3)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.825rem', fontWeight: 500, color: r.id === current.id ? 'var(--red-light)' : 'var(--text-1)', lineHeight: 1.2 }}>
                  {r.nombre}
                </p>
                <p style={{ fontSize: '0.65rem', color: rolColors[r.rol] ?? 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 3 }}>
                  {rolIcons[r.rol]}{r.rol}
                </p>
              </div>
              {r.id === current.id && <Check size={14} style={{ color: 'var(--red-light)', flexShrink: 0 }} />}
            </button>
          ))}
          {/* Create new branch button inside dropdown */}
          <div style={{ padding: '0.5rem', borderTop: '1px solid var(--border)', marginTop: '0.2rem' }}>
            <button 
              onClick={handleCreate}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                width: '100%', padding: '0.55rem 0.75rem',
                background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
                color: 'var(--red-light)', fontSize: '0.8rem', fontWeight: 500,
                transition: 'background var(--t-fast)', borderRadius: 'var(--r-xs)',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--red-glow)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <div style={{ width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</div>
              Crear nueva sucursal
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
