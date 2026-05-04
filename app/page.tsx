'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ParticleBackground } from '@/components/ui/particle-bg'

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <ParticleBackground />

      {/* Deep gradient overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1,
        background: 'radial-gradient(circle at 50% 40%, rgba(18,0,5,0.6) 0%, rgba(9,9,9,0.95) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Navigation / Header */}
      <header style={{
        position: 'relative', zIndex: 10,
        padding: '1.5rem 3rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--red), var(--red-dim))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(232,0,42,0.3)',
          }}>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: '#fff', fontSize: '1.1rem' }}>R</span>
          </div>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: 'var(--text-1)', fontSize: '1.25rem', letterSpacing: '0.02em' }}>
            The Rose Group
          </span>
        </div>
        <div>
          <Link href="/login" className="btn btn-ghost" style={{ fontSize: '0.9rem' }}>
            Iniciar sesión
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1, position: 'relative', zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '2rem', textAlign: 'center',
      }}>
        <div className="animate-fade-up" style={{ maxWidth: 800, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.4rem 1rem', borderRadius: 99,
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            marginBottom: '2rem',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              SaaS Restaurantes & Bares
            </span>
          </div>

          <h1 style={{
            fontFamily: "'Outfit', sans-serif", fontWeight: 800,
            fontSize: 'clamp(3rem, 6vw, 4.5rem)', color: 'var(--text-1)', lineHeight: 1.1,
            marginBottom: '1.5rem',
          }}>
            Precisión operativa para la <br />
            <span style={{ color: 'var(--red-light)', textShadow: '0 0 40px rgba(232,0,42,0.3)' }}>alta gastronomía</span>
          </h1>

          <p style={{
            color: 'var(--text-2)', fontSize: 'clamp(1rem, 1.5vw, 1.15rem)', lineHeight: 1.6,
            maxWidth: 600, marginBottom: '3rem'
          }}>
            El sistema multi-sucursal diseñado para gestionar mesas, pedidos en tiempo real y finanzas exactas sin errores de redondeo. Todo en una interfaz de alto rendimiento.
          </p>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Link href="/register" className="btn btn-red" style={{ padding: '0 2rem', height: 50, fontSize: '1rem' }}>
              Comenzar ahora
            </Link>
            <Link href="/login" className="btn btn-ghost" style={{ padding: '0 2rem', height: 50, fontSize: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              Ingresar al sistema <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer minimalista */}
      <footer style={{
        position: 'relative', zIndex: 10,
        padding: '2rem', textAlign: 'center', borderTop: '1px solid var(--border)',
        background: 'rgba(9,9,9,0.5)', backdropFilter: 'blur(10px)'
      }}>
        <p style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>
          © {new Date().getFullYear()} The Rose Group. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  )
}
