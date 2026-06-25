import { redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/features/auth/store/auth-store'

export function getAuthRedirect() {
  const { user, accessToken } = useAuthStore.getState()

  if (user && accessToken) {

    if (user.admin_profile || user.profile_type === 'ADMIN') {
      throw redirect({ to: '/admin' })
    } else if (user.profile_type === 'DRIVER') {
      throw redirect({ to: '/app/driver/viagens' })
    } else {
      throw redirect({ to: '/app' })
    }

  }
}
