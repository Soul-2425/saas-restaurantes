export default function ProductosPage() {
  return (
    <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
      <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '0.5rem' }}>
        Productos e Inventario
      </h1>
      <p style={{ color: 'var(--gold-light)', fontSize: '1rem', background: 'var(--gold-glow)', padding: '0.5rem 1rem', borderRadius: 'var(--r-full)', border: '1px solid var(--border-gold)' }}>
        Módulo en construcción (Próximamente)
      </p>
    </div>
  )
}
