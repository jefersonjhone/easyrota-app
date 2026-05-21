import { redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/features/auth/store/auth-store'

export function getAuthRedirect() {
  const { user, accessToken } = useAuthStore.getState()

  if (user && accessToken) {
    throw redirect({ to: '/app' })
  }
}
