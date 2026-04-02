import { useQuery } from '@tanstack/react-query'
import { getInvitations } from '../services/adminApi'

export function useInvitations() {
  return useQuery({
    queryKey: ['invitations'],
    queryFn: getInvitations,
  })
}
