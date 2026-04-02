import { useState } from 'react'
import { useLawyers } from '../hooks/useLawyers'
import { useToggleLawyerStatus } from '../hooks/useToggleLawyerStatus'
import { LawyerTable } from '../components/LawyerTable'
import { Pagination } from '@/shared/components/Pagination'
import { Spinner } from '@/shared/components/Spinner'

const LIMIT = 10

export default function AdminLawyersView() {
  const [page, setPage] = useState(1)
  const lawyers = useLawyers({ page, limit: LIMIT })
  const toggleMutation = useToggleLawyerStatus()

  if (lawyers.isLoading) {
    return <Spinner size="lg" />
  }

  const data = lawyers.data

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '24px' }}>
        Abogados
      </h1>

      <LawyerTable
        lawyers={data?.data ?? []}
        onToggleStatus={(id) => toggleMutation.mutate(id)}
        toggleLoading={toggleMutation.isPending}
      />

      {data && data.total > 0 && (
        <Pagination
          page={page}
          totalPages={Math.ceil(data.total / (data.limit || LIMIT))}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}
