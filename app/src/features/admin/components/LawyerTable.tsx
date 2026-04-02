import type { User } from '@/shared/types'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { Button } from '@/shared/components/Button'
import { useAuthStore } from '@/stores/authStore'

interface LawyerTableProps {
  lawyers: User[]
  onToggleStatus: (id: string) => void
  toggleLoading?: boolean
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase',
  borderBottom: '2px solid var(--color-border)',
}

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: '14px',
  color: 'var(--color-text-primary)',
  borderBottom: '1px solid var(--color-border)',
}

export function LawyerTable({ lawyers, onToggleStatus, toggleLoading }: LawyerTableProps) {
  const currentUserId = useAuthStore((s) => s.user?.id)

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={thStyle}>Nombre</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Pais</th>
            <th style={thStyle}>Estado</th>
            <th style={thStyle}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {lawyers.map((lawyer) => (
            <tr key={lawyer.id}>
              <td style={tdStyle}>{lawyer.name}</td>
              <td style={tdStyle}>{lawyer.email}</td>
              <td style={tdStyle}>{lawyer.country ?? '-'}</td>
              <td style={tdStyle}>
                <StatusBadge status={lawyer.status} />
              </td>
              <td style={tdStyle}>
                {lawyer.id === currentUserId ? (
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>—</span>
                ) : (
                  <Button
                    variant={lawyer.status === 'active' ? 'danger' : 'secondary'}
                    onClick={() => onToggleStatus(lawyer.id)}
                    loading={toggleLoading}
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    {lawyer.status === 'active' ? 'Suspender' : 'Activar'}
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
