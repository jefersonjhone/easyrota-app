import { redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { requireAuth } from './require-auth'

export function requireAdmin() {
    requireAuth()

  const user = useAuthStore.getState().user

  const isAdmin = user?.profile_type === "ADMIN"

  if (!isAdmin) {
    throw redirect({ to: "/app" })
  }
}
