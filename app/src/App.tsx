import { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, useNavigate } from 'react-router'
import { ToastProvider } from '@/shared/components/Toast'
import { AppRouter } from '@/router'
import { useAuthStore } from '@/stores/authStore'
import { apiClient } from '@/shared/utils/api-client'
import { Spinner } from '@/shared/components/Spinner'
import type { CheckStatusResponse } from '@/shared/types'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function AuthCheck({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  const setAuth = useAuthStore((s) => s.setAuth)
  const logout = useAuthStore((s) => s.logout)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const navigate = useNavigate()
  const [ready, setReady] = useState(!token)

  useEffect(() => {
    if (!token) {
      setReady(true)
      return
    }

    apiClient
      .get<CheckStatusResponse>('/auth/check-status')
      .then(({ data }) => {
        setAuth(data.user, data.token, refreshToken ?? '')
      })
      .catch((error) => {
        const errors = error?.response?.data?.errors
        const msgCode = Array.isArray(errors) ? errors[0]?.msgCode : error?.response?.data?.msgCode
        if (msgCode === 'ST0004' || msgCode === 'ST0002') {
          logout()
          navigate('/auth/login', {
            state: {
              message: 'No es posible acceder en este momento',
            },
          })
        } else if (error?.response?.status === 401) {
          logout()
        }
      })
      .finally(() => setReady(true))
  }, [])

  if (!ready) return <Spinner size="lg" />

  return <>{children}</>
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <AuthCheck>
            <AppRouter />
          </AuthCheck>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
