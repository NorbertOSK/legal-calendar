import { Button } from '@/shared/components/Button'
import { ViewToggle } from '@/shared/components/ViewToggle'

interface CalendarHeaderProps {
  label: string
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  viewMode: 'calendar' | 'list'
  onViewModeChange: (mode: 'calendar' | 'list') => void
}

export function CalendarHeader({ label, onPrev, onNext, onToday, viewMode, onViewModeChange }: CalendarHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '16px',
        padding: '16px 0',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-primary)' }}>
          Agenda
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
            {label}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Button variant="ghost" onClick={onPrev}>←</Button>
            <Button variant="ghost" onClick={onToday}>Hoy</Button>
            <Button variant="ghost" onClick={onNext}>→</Button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <ViewToggle mode={viewMode} onChange={onViewModeChange} />
      </div>
    </div>
  )
}
