import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { useToast } from '@/shared/components/Toast'
import { useAuthStore } from '@/stores/authStore'
import { deleteAccount } from '../services/profileApi'

export function useDeleteAccount() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const logout = useAuthStore((s) => s.logout)

  return useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      logout()
      navigate('/auth/login')
      addToast('success', 'Cuenta eliminada')
    },
  })
}
