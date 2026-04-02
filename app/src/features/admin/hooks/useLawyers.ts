import { useQuery } from '@tanstack/react-query'
import { getLawyers } from '../services/adminApi'

export function useLawyers(params: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['lawyers', params],
    queryFn: () => getLawyers(params),
  })
}
