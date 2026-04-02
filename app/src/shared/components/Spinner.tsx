interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
}

const sizes = { sm: 16, md: 32, lg: 48 }

export function Spinner({ size = 'md' }: SpinnerProps) {
  const px = sizes[size]
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px' }}>
      <div
        style={{
          width: px,
          height: px,
          border: '3px solid var(--color-border)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }}
      />
    </div>
  )
}
