import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

const stats = [
  { label: 'Mesas activas',     value: '—',   sub: 'ocupadas ahora',    color: 'var(--red-light)',  glow: 'var(--red-glow)',  border: 'var(--red-border)'  },
  { label: 'Pedidos abiertos',  value: '—',   sub: 'en curso',          color: 'var(--gold-light)', glow: 'var(--gold-glow)', border: 'var(--border-gold)' },
  { label: 'Reservas hoy',      value: '—',   sub: 'confirmadas',       color: 'var(--text-1)',     glow: 'transparent',      border: 'var(--border)'      },
  { label: 'Ingresos del día',  value: '$—',  sub: 'pendiente de cierre', color: 'var(--gold-light)', glow: 'var(--gold-glow)', border: 'var(--border-gold)' },
]

export default function DashboardPage() {
  return (
    <div className="animate-fade-up" style={{ maxWidth: 1200 }}>

      {/* Page header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ height: 20, width: 3, background: 'var(--red)', borderRadius: 99, boxShadow: '0 0 8px var(--red)' }} />
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '1.5rem', color: 'var(--text-1)' }}>
            Dashboard
          </h1>
        </div>
        <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', paddingLeft: '1rem' }}>
          Bienvenido al sistema de gestión de tu sucursal.
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {stats.map(({ label, value, sub, color, glow, border }) => (
          <div key={label} className="card" style={{
            background: `linear-gradient(145deg, var(--surface-1) 0%, var(--surface-0) 100%)`,
            borderColor: border, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 0, right: 0,
              width: 80, height: 80,
              background: glow,
              borderRadius: '0 var(--r-lg) 0 100%',
            }} />
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              {label}
            </p>
            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2rem', fontWeight: 700, color, lineHeight: 1, marginBottom: '0.4rem' }}>
              {value}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <div style={{ width: 3, height: 16, background: 'var(--gold)', borderRadius: 99 }} />
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-1)' }}>Accesos rápidos</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
          {[
            { label: 'Nueva mesa',   href: '/dashboard/mesas',     emoji: '🪑' },
            { label: 'Nuevo pedido', href: '/dashboard/pedidos',    emoji: '🍽️' },
            { label: 'Reserva',      href: '/dashboard/reservas',   emoji: '📅' },
            { label: 'Producto',     href: '/dashboard/productos',  emoji: '📦' },
          ].map(({ label, href, emoji }) => (
            <a key={href} href={href} className="quick-link" style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-sm)', padding: '0.65rem 0.875rem',
              color: 'var(--text-2)', fontSize: '0.85rem', fontWeight: 500,
              textDecoration: 'none', transition: 'all var(--t-base)',
            }}>
              <span style={{ fontSize: '1.1rem' }}>{emoji}</span>
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* Phase 3 notice */}
      <div style={{
        background: 'var(--red-glow)', border: '1px solid var(--red-border)',
        borderRadius: 'var(--r-md)', padding: '1rem 1.25rem',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
      }}>
        <span style={{ fontSize: '1.1rem' }}>🚀</span>
        <div>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--red-light)', marginBottom: '0.1rem' }}>
            Fase 3 · Lote 1 completado
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
            Layout, Sidebar, Branch Selector y Login construidos. El Lote 2 traerá las vistas operativas de Mesas y Pedidos en tiempo real.
          </p>
        </div>
      </div>
    </div>
  )
}
