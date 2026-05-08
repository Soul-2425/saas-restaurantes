'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Restaurante {
  id: string
  nombre: string
  slug: string
}

interface Producto {
  id: string
  nombre: string
  descripcion: string | null
  precio: number
  categoria: string
  es_por_tiempo: boolean
  disponible: boolean
}

type EstadoForm = 'idle' | 'loading' | 'success' | 'error'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatPrecio = (n: number, esTiempo: boolean) =>
  esTiempo ? `$${n.toFixed(2)}/hr` : `$${n.toFixed(2)}`

function groupByCategory(productos: Producto[]) {
  return productos.reduce<Record<string, Producto[]>>((acc, p) => {
    if (!acc[p.categoria]) acc[p.categoria] = []
    acc[p.categoria].push(p)
    return acc
  }, {})
}

const categoryEmoji: Record<string, string> = {
  comida: '🍽️',
  bebida: '🥤',
  bebidas: '🥤',
  postre: '🍰',
  postres: '🍰',
  licor: '🍷',
  licores: '🍷',
  cocktail: '🍹',
  cocktails: '🍹',
  billar: '🎱',
  default: '📦',
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function PublicRestaurantePage() {
  const { slug } = useParams<{ slug: string }>()

  const [restaurante, setRestaurante] = useState<Restaurante | null>(null)
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  // Form state
  const [form, setForm] = useState({
    nombre_cliente: '',
    email_cliente: '',
    telefono_cliente: '',
    fecha: '',
    hora: '',
    personas: '2',
    notas: '',
  })
  const [formState, setFormState] = useState<EstadoForm>('idle')
  const [formMsg, setFormMsg] = useState('')
  const reservasRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Load data
  useEffect(() => {
    fetch(`/api/public/${slug}`)
      .then(r => r.json())
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true); setLoading(false); return }
        setRestaurante(data.restaurante)
        setProductos(data.productos)
        const cats = Object.keys(groupByCategory(data.productos))
        if (cats.length) setActiveCategory(cats[0])
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [slug])

  const grouped = groupByCategory(productos)
  const categories = Object.keys(grouped)

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormState('loading')
    setFormMsg('')
    try {
      const res = await fetch(`/api/public/${slug}/reservas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const { message, error } = await res.json()
      if (!res.ok) { setFormState('error'); setFormMsg(error || 'Algo salió mal.'); return }
      setFormState('success')
      setFormMsg(message || '¡Reserva enviada exitosamente!')
      setForm({ nombre_cliente: '', email_cliente: '', telefono_cliente: '', fecha: '', hora: '', personas: '2', notas: '' })
    } catch {
      setFormState('error')
      setFormMsg('Error de conexión. Intenta de nuevo.')
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, border: '3px solid var(--red-border)', borderTopColor: 'var(--red)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-3)', fontSize: '0.9rem' }}>Cargando...</p>
      </div>
    </div>
  )

  // ── Not found ──────────────────────────────────────────────────────────────
  if (notFound) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: '1rem', textAlign: 'center', padding: '2rem' }}>
      <span style={{ fontSize: '4rem' }}>🍽️</span>
      <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.75rem', color: 'var(--text-1)' }}>Restaurante no encontrado</h1>
      <p style={{ color: 'var(--text-3)' }}>Este local no existe o no está disponible en este momento.</p>
      <a href="/" className="btn btn-red">Volver al inicio</a>
    </div>
  )

  // ── Main page ──────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: "'Inter', sans-serif" }}>
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <header style={{
        position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', textAlign: 'center', overflow: 'hidden',
      }}>
        {/* Background gradients */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(232,0,42,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, var(--red-border), transparent)' }} />

        {/* Grid pattern */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
          backgroundSize: '40px 40px', pointerEvents: 'none'
        }} />

        {/* Floating nav */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 2rem',
          background: 'rgba(9,9,9,0.85)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 36, height: 36, background: 'var(--red)', borderRadius: 'var(--r-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#fff',
            }}>
              {restaurante!.nombre.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '1rem', color: 'var(--text-1)' }}>
              {restaurante!.nombre}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => scrollTo(menuRef)} className="btn btn-ghost" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
              Ver menú
            </button>
            <button onClick={() => scrollTo(reservasRef)} className="btn btn-red" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
              Reservar mesa
            </button>
          </div>
        </nav>

        {/* Hero content */}
        <div style={{ position: 'relative', zIndex: 10, maxWidth: 700, padding: '0 2rem', animation: 'fadeUp 0.6s var(--ease) both' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--red-glow)', border: '1px solid var(--red-border)', borderRadius: 99, padding: '0.3rem 0.9rem', marginBottom: '1.5rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', boxShadow: '0 0 8px var(--red)', display: 'inline-block' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--red-light)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Abierto ahora</span>
          </div>
          <h1 style={{
            fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(3rem, 8vw, 5.5rem)',
            fontWeight: 800, lineHeight: 1.05, color: 'var(--text-1)', marginBottom: '1rem',
            letterSpacing: '-0.02em',
          }}>
            {restaurante!.nombre}
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', color: 'var(--text-2)', marginBottom: '2.5rem', lineHeight: 1.7 }}>
            Explora nuestro menú, reserva tu mesa y vive una experiencia única.<br />
            <span style={{ color: 'var(--text-3)', fontSize: '0.9em' }}>Reservas en tiempo real · Confirmación inmediata</span>
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => scrollTo(reservasRef)} className="btn btn-red" style={{ fontSize: '1rem', padding: '0.85rem 2rem' }}>
              📅 Reservar mesa
            </button>
            <button onClick={() => scrollTo(menuRef)} className="btn btn-ghost" style={{ fontSize: '1rem', padding: '0.85rem 2rem' }}>
              🍽️ Ver menú
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', animation: 'fadeIn 1s 0.8s var(--ease) both', textAlign: 'center' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Scroll</p>
          <div style={{ width: 1, height: 40, background: 'linear-gradient(var(--red), transparent)', margin: '0 auto' }} />
        </div>
      </header>

      {/* ── STATS BAR ─────────────────────────────────────────────────────── */}
      <section style={{ background: 'var(--surface-1)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { emoji: '🍽️', label: `${productos.length} Platillos`, sub: 'en nuestro menú' },
            { emoji: '📅', label: 'Reservas 24/7', sub: 'confirmación inmediata' },
            { emoji: '⭐', label: 'Experiencia Premium', sub: 'para ti y tus invitados' },
            { emoji: '🚀', label: 'Pedidos en tiempo real', sub: 'sistema digital moderno' },
          ].map(({ emoji, label, sub }) => (
            <div key={label} style={{ textAlign: 'center', minWidth: 140 }}>
              <p style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{emoji}</p>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-1)' }}>{label}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── MENU ──────────────────────────────────────────────────────────── */}
      <section ref={menuRef} style={{ padding: 'clamp(3rem, 8vw, 6rem) 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--red-light)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Lo que ofrecemos</p>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, color: 'var(--text-1)' }}>Nuestro Menú</h2>
            <div style={{ width: 60, height: 3, background: 'var(--red)', borderRadius: 99, margin: '1rem auto 0' }} />
          </div>

          {categories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍽️</p>
              <p style={{ color: 'var(--text-3)' }}>El menú está siendo actualizado. Vuelve pronto.</p>
            </div>
          ) : (
            <>
              {/* Category tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem', justifyContent: 'center' }}>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className="btn"
                    style={{
                      fontSize: '0.85rem', padding: '0.5rem 1.25rem',
                      background: activeCategory === cat ? 'var(--red)' : 'var(--surface-2)',
                      color: activeCategory === cat ? '#fff' : 'var(--text-2)',
                      border: `1px solid ${activeCategory === cat ? 'var(--red)' : 'var(--border)'}`,
                      transition: 'all var(--t-base)',
                    }}
                  >
                    {categoryEmoji[cat.toLowerCase()] ?? categoryEmoji.default} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>&nbsp;({grouped[cat].length})</span>
                  </button>
                ))}
              </div>

              {/* Products grid */}
              {activeCategory && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '1.25rem',
                  animation: 'fadeUp 0.3s var(--ease) both',
                }}>
                  {grouped[activeCategory].map(producto => (
                    <div key={producto.id} className="card" style={{
                      display: 'flex', flexDirection: 'column', gap: '0.75rem',
                      border: '1px solid var(--border)',
                      transition: 'border-color var(--t-base), transform var(--t-base)',
                      cursor: 'default',
                    }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'var(--red-border)'
                        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
                        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div>
                          <p style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: '0.95rem', marginBottom: '0.2rem' }}>{producto.nombre}</p>
                          {producto.descripcion && (
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', lineHeight: 1.5 }}>{producto.descripcion}</p>
                          )}
                        </div>
                        {producto.es_por_tiempo && (
                          <span className="badge badge-gold" style={{ flexShrink: 0, fontSize: '0.6rem' }}>⏱ Tiempo</span>
                        )}
                      </div>
                      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{
                          fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '1.25rem',
                          color: 'var(--gold-light)',
                        }}>
                          {formatPrecio(producto.precio, producto.es_por_tiempo)}
                        </p>
                        <button
                          onClick={() => scrollTo(reservasRef)}
                          className="btn"
                          style={{ fontSize: '0.75rem', padding: '0.4rem 0.9rem', background: 'var(--red-glow)', color: 'var(--red-light)', border: '1px solid var(--red-border)' }}
                        >
                          Reservar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── RESERVATIONS ──────────────────────────────────────────────────── */}
      <section ref={reservasRef} style={{ padding: 'clamp(3rem, 8vw, 6rem) 2rem', background: 'var(--surface-0)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--red-light)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Reserva tu mesa</p>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(2rem, 5vw, 2.75rem)', fontWeight: 700, color: 'var(--text-1)' }}>Haz tu Reservación</h2>
            <p style={{ color: 'var(--text-3)', marginTop: '0.75rem', fontSize: '0.9rem' }}>
              Completa el formulario y recibirás una confirmación. Sin esperas.
            </p>
            <div style={{ width: 60, height: 3, background: 'var(--red)', borderRadius: 99, margin: '1rem auto 0' }} />
          </div>

          {/* Form card */}
          <div className="card-glass" style={{ padding: '2rem' }}>
            {formState === 'success' ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', animation: 'fadeUp 0.4s var(--ease) both' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.5rem', color: 'var(--text-1)', marginBottom: '0.5rem' }}>¡Reserva Enviada!</h3>
                <p style={{ color: 'var(--text-2)', marginBottom: '1.5rem' }}>{formMsg}</p>
                <button onClick={() => setFormState('idle')} className="btn btn-ghost" style={{ fontSize: '0.85rem' }}>
                  Hacer otra reserva
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-3)', fontWeight: 500, display: 'block', marginBottom: '0.4rem' }}>
                      Nombre completo *
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Juan Pérez"
                      value={form.nombre_cliente}
                      onChange={e => setForm(f => ({ ...f, nombre_cliente: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-3)', fontWeight: 500, display: 'block', marginBottom: '0.4rem' }}>
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      placeholder="+58 412 000 0000"
                      value={form.telefono_cliente}
                      onChange={e => setForm(f => ({ ...f, telefono_cliente: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-3)', fontWeight: 500, display: 'block', marginBottom: '0.4rem' }}>
                    Correo electrónico *
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="tu@correo.com"
                    value={form.email_cliente}
                    onChange={e => setForm(f => ({ ...f, email_cliente: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-3)', fontWeight: 500, display: 'block', marginBottom: '0.4rem' }}>
                      Fecha *
                    </label>
                    <input
                      required
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={form.fecha}
                      onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-3)', fontWeight: 500, display: 'block', marginBottom: '0.4rem' }}>
                      Hora *
                    </label>
                    <input
                      required
                      type="time"
                      value={form.hora}
                      onChange={e => setForm(f => ({ ...f, hora: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-3)', fontWeight: 500, display: 'block', marginBottom: '0.4rem' }}>
                      Personas *
                    </label>
                    <select
                      required
                      value={form.personas}
                      onChange={e => setForm(f => ({ ...f, personas: e.target.value }))}
                    >
                      {[1,2,3,4,5,6,7,8,10,12,15,20].map(n => (
                        <option key={n} value={n}>{n} {n === 1 ? 'persona' : 'personas'}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-3)', fontWeight: 500, display: 'block', marginBottom: '0.4rem' }}>
                    Notas adicionales (opcional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Alergias, celebraciones, preferencias de mesa..."
                    value={form.notas}
                    onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {formState === 'error' && (
                  <div style={{ background: 'var(--red-glow)', border: '1px solid var(--red-border)', borderRadius: 'var(--r-sm)', padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--red-light)' }}>
                    ⚠️ {formMsg}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-red"
                  disabled={formState === 'loading'}
                  style={{ fontSize: '1rem', padding: '0.85rem', marginTop: '0.5rem', opacity: formState === 'loading' ? 0.7 : 1 }}
                >
                  {formState === 'loading' ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                      Enviando...
                    </span>
                  ) : '📅 Confirmar Reserva'}
                </button>

                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-3)' }}>
                  Al reservar, aceptas que el local se comunique contigo para confirmar tu reserva.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer style={{
        padding: '2rem', textAlign: 'center',
        borderTop: '1px solid var(--border)', background: 'var(--bg)',
      }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
          © 2025 {restaurante!.nombre} · Powered by{' '}
          <span style={{ color: 'var(--red-light)', fontWeight: 600 }}>The Rose Group SaaS</span>
        </p>
      </footer>
    </div>
  )
}
