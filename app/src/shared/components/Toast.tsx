import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  type: ToastType
  message: string
}

interface ToastContextValue {
  addToast: (type: ToastType, message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let toastId = 0

const typeColors: Record<ToastType, { bg: string; border: string }> = {
  success: { bg: '#ecfdf5', border: 'var(--color-success)' },
  error: { bg: '#fef2f2', border: 'var(--color-danger)' },
  info: { bg: '#eff6ff', border: 'var(--color-info)' },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const { type, message } = (e as CustomEvent).detail
      addToast(type, message)
    }
    window.addEventListener('toast', handleToastEvent)
    return () => window.removeEventListener('toast', handleToastEvent)
  }, [addToast])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext value={{ addToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 100,
        }}
      >
        {toasts.map((toast) => {
          const colors = typeColors[toast.type]
          return (
            <div
              key={toast.id}
              style={{
                padding: '12px 16px',
                background: colors.bg,
                borderLeft: `4px solid ${colors.border}`,
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)',
                fontSize: '14px',
                color: 'var(--color-text-primary)',
                maxWidth: '360px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <span>{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-secondary)', fontSize: '16px', padding: 0 }}
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
