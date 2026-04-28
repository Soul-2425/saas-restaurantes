'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ParticleBackground } from '@/components/ui/particle-bg'
import { Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const { data, error: apiError } = await res.json()
      if (!res.ok || apiError) { setError(apiError ?? 'Credenciales inválidas'); return }
      if (data) router.push('/dashboard')
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', position: 'relative', overflow: 'hidden' }}>
      <ParticleBackground />

      {/* Deep gradient overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1,
        background: 'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(18,0,5,0.7) 0%, rgba(9,9,9,0.95) 100%)',
        pointerEvents: 'none',
      }} />

      {/* ── Left panel — Brand showcase ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '3rem 4rem', position: 'relative', zIndex: 2,
      }} className="animate-fade-in">

        {/* Logo mark */}
        <div style={{ marginBottom: '3rem' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, var(--red), var(--red-dim))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(232,0,42,0.35)',
            marginBottom: '1.25rem',
          }}>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: '#fff', fontSize: '1.5rem' }}>R</span>
          </div>
          <h1 style={{
            fontFamily: "'Outfit', sans-serif", fontWeight: 800,
            fontSize: 'clamp(2rem, 3vw, 2.75rem)', color: 'var(--text-1)', lineHeight: 1.15,
            marginBottom: '0.75rem',
          }}>
            The Rose<br />
            <span style={{ color: 'var(--red-light)' }}>Group</span>
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: '1rem', maxWidth: 360, lineHeight: 1.7 }}>
            Sistema de gestión <span style={{ color: 'var(--gold-light)' }}>Multi-Sucursal</span> para
            Restaurantes, Bares y Billares.
          </p>
        </div>

        {/* Feature bullets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {[
            { icon: '⚡', label: 'Pedidos en tiempo real con Supabase Realtime' },
            { icon: '🔒', label: 'Aislamiento Multi-Tenant con RLS a nivel de BD' },
            { icon: '💱', label: 'Pagos multi-moneda con auditoría de alta precisión' },
          ].map(({ icon, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{
                width: 32, height: 32, borderRadius: 'var(--r-sm)',
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.85rem', flexShrink: 0,
              }}>{icon}</span>
              <span style={{ color: 'var(--text-2)', fontSize: '0.85rem' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Gold accent line */}
        <div style={{ marginTop: '3rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ height: 2, width: 32, background: 'linear-gradient(90deg, var(--gold), transparent)' }} />
          <span style={{ color: 'var(--text-3)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Multi-Tenant SaaS · 2025
          </span>
        </div>
      </div>

      {/* ── Right panel — Login form ── */}
      <div style={{
        width: 480, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem', position: 'relative', zIndex: 2,
      }}>
        <div className="card-glass animate-fade-up" style={{ width: '100%', padding: '2.5rem' }}>

          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '1.5rem', color: 'var(--text-1)', marginBottom: '0.4rem' }}>
              Bienvenido de vuelta
            </h2>
            <p style={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {error && (
            <div style={{
              background: 'rgba(232,0,42,0.1)', border: '1px solid var(--red-border)',
              borderRadius: 'var(--r-sm)', padding: '0.65rem 0.875rem',
              color: 'var(--red-light)', fontSize: '0.825rem', marginBottom: '1.25rem',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-2)', marginBottom: '0.4rem' }}>
                Correo electrónico
              </label>
              <input
                type="email" required autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                style={{ background: 'var(--surface-2)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-2)', marginBottom: '0.4rem' }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'} required autoComplete="current-password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ background: 'var(--surface-2)', paddingRight: '2.75rem' }}
                />
                <button type="button" onClick={() => setShowPass(p => !p)} style={{
                  position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)',
                  display: 'flex', alignItems: 'center',
                }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <a href="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <button type="submit" disabled={loading} className="btn btn-red" style={{ width: '100%', marginTop: '0.25rem', height: 44 }}>
              {loading
                ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
                : <><span>Iniciar sesión</span><ArrowRight size={16} /></>
              }
            </button>
          </form>

          <div className="divider" style={{ margin: '1.5rem 0' }} />

          <p style={{ textAlign: 'center', fontSize: '0.825rem', color: 'var(--text-3)' }}>
            ¿No tienes cuenta?{' '}
            <a href="/register" style={{ color: 'var(--gold-light)', fontWeight: 500 }}>
              Crear cuenta
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
