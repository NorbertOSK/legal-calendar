import type { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
}

const containerStyle: React.CSSProperties = {
  minHeight: '100dvh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--color-surface)',
  padding: 'var(--spacing-md)',
}

const cardStyle: React.CSSProperties = {
  background: 'var(--color-background)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-md)',
  padding: 'var(--spacing-xl)',
  width: '100%',
  maxWidth: '440px',
}

const logoStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 700,
  color: 'var(--color-primary)',
  textAlign: 'center',
  marginBottom: 'var(--spacing-lg)',
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={logoStyle}>Legal Calendar</div>
        {children}
      </div>
    </div>
  )
}
