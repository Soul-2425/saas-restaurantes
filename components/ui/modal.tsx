'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  maxWidth?: string
}

export function Modal({ isOpen, onClose, title, children, maxWidth = '500px' }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem'
    }}>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(9, 9, 9, 0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          animation: 'fadeIn 0.2s var(--ease) both',
        }} 
      />

      {/* Content */}
      <div className="card" style={{
        position: 'relative', zIndex: 101,
        width: '100%', maxWidth,
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        padding: 0,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-hover)',
        animation: 'fadeUp 0.3s var(--ease) both',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--surface-1)'
        }}>
          <h2 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-1)' }}>
            {title}
          </h2>
          <button 
            onClick={onClose}
            className="btn-ghost"
            style={{
              width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 'var(--r-xs)', border: 'none'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          padding: '1.5rem',
          overflowY: 'auto',
          background: 'var(--surface-0)'
        }}>
          {children}
        </div>
      </div>
    </div>
  )
}
