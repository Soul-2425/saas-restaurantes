'use client'

import { BranchSelector } from './branch-selector'
import { Bell, Search } from 'lucide-react'

export function DashboardHeader() {
  return (
    <header style={{
      height: 'var(--header-h)',
      background: 'rgba(13,13,13,0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 1.5rem',
      gap: '1rem',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>

      {/* Branch Selector */}
      <BranchSelector />

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Search hint */}
      <button style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        background: 'var(--surface-1)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-sm)', padding: '0.45rem 0.85rem',
        color: 'var(--text-3)', cursor: 'pointer', fontSize: '0.8rem',
        transition: 'all var(--t-base)',
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-2)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-3)' }}
      >
        <Search size={13} />
        Buscar...
        <kbd style={{ marginLeft: '0.25rem', background: 'var(--surface-3)', borderRadius: 4, padding: '0.1rem 0.35rem', fontSize: '0.65rem', color: 'var(--text-3)' }}>⌘K</kbd>
      </button>

      {/* Notifications */}
      <button style={{
        width: 36, height: 36, borderRadius: 'var(--r-sm)',
        background: 'var(--surface-1)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', position: 'relative', transition: 'all var(--t-base)',
        color: 'var(--text-2)',
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--red-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--red-light)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-2)' }}
      >
        <Bell size={15} />
        <span style={{
          position: 'absolute', top: 6, right: 6,
          width: 7, height: 7, borderRadius: '50%',
          background: 'var(--red)', border: '1.5px solid var(--surface-1)',
        }} />
      </button>

      {/* User Avatar */}
      <div style={{
        width: 34, height: 34, borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--red), var(--red-dim))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, color: '#fff',
        boxShadow: '0 0 12px var(--red-glow)', border: '1.5px solid var(--red-border)',
        flexShrink: 0,
      }}>
        R
      </div>
    </header>
  )
}
