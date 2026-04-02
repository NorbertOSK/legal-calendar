import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/shared/components/Toast'
import { useAuthStore } from '@/stores/authStore'
import { updateProfile } from '../services/profileApi'

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const setUser = useAuthStore((s) => s.setUser)

  return useMutation({
    mutationFn: (data: { name?: string; country?: string; timezone?: string }) =>
      updateProfile(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      setUser(result.user)
      addToast('success', 'Perfil actualizado')
    },
  })
}
