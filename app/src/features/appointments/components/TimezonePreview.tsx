import { getTimezonePreview } from '@/shared/utils/timezone'

interface TimezonePreviewProps {
  dateStr: string
  lawyerTimezone: string
  clientTimezone: string
}

export function TimezonePreview({ dateStr, lawyerTimezone, clientTimezone }: TimezonePreviewProps) {
  const { lawyerTime, clientTime } = getTimezonePreview(dateStr, lawyerTimezone, clientTimezone)

  return (
    <div
      style={{
        padding: '8px 12px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-primary-light)',
        fontSize: '13px',
        color: 'var(--color-text-primary)',
      }}
    >
      {lawyerTime} tu hora / {clientTime} hora del cliente
    </div>
  )
}
