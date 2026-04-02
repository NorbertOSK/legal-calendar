import { Select } from '@/shared/components/Select'
import { Button } from '@/shared/components/Button'

interface AppointmentFiltersProps {
  statusFilter?: string
  clientEmailFilter?: string
  uniqueClientEmails: string[]
  onStatusChange: (status?: string) => void
  onClientEmailChange: (email?: string) => void
  onReset: () => void
}

const statusOptions = [
  { value: '', label: 'Todas' },
  { value: 'SCHEDULED', label: 'Programadas' },
  { value: 'COMPLETED', label: 'Completadas' },
  { value: 'CANCELLED', label: 'Canceladas' },
]

export function AppointmentFilters({
  statusFilter,
  clientEmailFilter,
  uniqueClientEmails,
  onStatusChange,
  onClientEmailChange,
  onReset,
}: AppointmentFiltersProps) {
  const emailOptions = uniqueClientEmails.map((email) => ({
    value: email,
    label: email,
  }))

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
      <div style={{ minWidth: '180px' }}>
        <Select
          label="Estado"
          options={statusOptions}
          value={statusFilter ?? ''}
          onChange={(e) => onStatusChange(e.target.value || undefined)}
        />
      </div>
      <div style={{ minWidth: '220px' }}>
        <Select
          label="Cliente"
          options={emailOptions}
          placeholder="Todos los clientes"
          value={clientEmailFilter ?? ''}
          onChange={(e) => onClientEmailChange(e.target.value || undefined)}
        />
      </div>
      <Button variant="ghost" onClick={onReset}>
        Limpiar filtros
      </Button>
    </div>
  )
}
