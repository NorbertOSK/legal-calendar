interface ViewToggleProps {
  mode: 'calendar' | 'list'
  onChange: (mode: 'calendar' | 'list') => void
}

export function ViewToggle({ mode, onChange }: ViewToggleProps) {
  const buttonBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '112px',
    minHeight: '38px',
    padding: '8px 16px',
    boxSizing: 'border-box',
    border: '1px solid var(--color-border)',
    fontSize: '13px',
    fontWeight: 500,
    lineHeight: 1,
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  }

  return (
    <div style={{ display: 'inline-flex' }}>
      <button
        style={{
          ...buttonBase,
          borderRadius: 'var(--radius-md) 0 0 var(--radius-md)',
          background: mode === 'calendar' ? 'var(--color-text-primary)' : 'var(--color-background)',
          color: mode === 'calendar' ? '#fff' : 'var(--color-text-secondary)',
          border: mode === 'calendar' ? '1px solid var(--color-text-primary)' : '1px solid var(--color-border)',
        }}
        onClick={() => onChange('calendar')}
      >
        Calendario
      </button>
      <button
        style={{
          ...buttonBase,
          borderRadius: '0 var(--radius-md) var(--radius-md) 0',
          background: mode === 'list' ? 'var(--color-text-primary)' : 'var(--color-background)',
          color: mode === 'list' ? '#fff' : 'var(--color-text-secondary)',
          border: mode === 'list' ? '1px solid var(--color-text-primary)' : '1px solid var(--color-border)',
          marginLeft: '-1px',
        }}
        onClick={() => onChange('list')}
      >
        Lista
      </button>
    </div>
  )
}
