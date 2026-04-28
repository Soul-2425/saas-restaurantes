'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Grid2x2, ClipboardList,
  CalendarDays, Package, BarChart3, Settings, LogOut,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard',               icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/mesas',         icon: Grid2x2,         label: 'Mesas' },
  { href: '/dashboard/pedidos',       icon: ClipboardList,   label: 'Pedidos' },
  { href: '/dashboard/reservas',      icon: CalendarDays,    label: 'Reservas' },
  { href: '/dashboard/productos',     icon: Package,         label: 'Productos' },
  { href: '/dashboard/reportes',      icon: BarChart3,       label: 'Reportes' },
  { href: '/dashboard/configuracion', icon: Settings,        label: 'Configuración' },
]

export function Sidebar() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <aside style={{
      width: 'var(--sidebar-w)',
      minHeight: '100vh',
      background: 'var(--surface-0)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0, top: 0, bottom: 0,
      zIndex: 50,
    }}>

      {/* Brand */}
      <div style={{ padding: '1.5rem 1.25rem 1rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--r-sm)',
            background: 'linear-gradient(135deg, var(--red), var(--red-dim))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-red)', flexShrink: 0,
          }}>
            <span style={{ color: '#fff', fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1rem' }}>R</span>
          </div>
          <div>
            <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-1)', lineHeight: 1.2 }}>
              The Rose Group
            </p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-3)', letterSpacing: '0.04em' }}>GESTIÓN MULTI-SUCURSAL</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.75rem 0.75rem', overflowY: 'auto' }}>
        <p style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.5rem 0.5rem 0.75rem' }}>
          Menú Principal
        </p>
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = isActive(href)
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.6rem 0.75rem', borderRadius: 'var(--r-sm)',
              marginBottom: '0.15rem',
              background: active ? 'var(--red-glow)' : 'transparent',
              border: active ? '1px solid var(--red-border)' : '1px solid transparent',
              color: active ? 'var(--red-light)' : 'var(--text-2)',
              fontWeight: active ? 600 : 400,
              fontSize: '0.875rem',
              textDecoration: 'none',
              transition: 'all var(--t-base)',
            }}
              onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-1)' }}}
              onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-2)' }}}
            >
              <Icon size={16} style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }} />
              {label}
              {active && <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', boxShadow: '0 0 6px var(--red)' }} />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)' }}>
        <button onClick={handleLogout} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', gap: '0.75rem', fontSize: '0.875rem' }}>
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
