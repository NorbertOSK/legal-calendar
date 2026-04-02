import { useQuery } from '@tanstack/react-query'
import { validateInvitation } from '../services/authApi'

export function useValidateInvitation(token: string) {
  return useQuery({
    queryKey: ['invitation', token],
    queryFn: () => validateInvitation(token),
    enabled: !!token,
  })
}
