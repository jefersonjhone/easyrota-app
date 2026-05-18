import { createFileRoute } from '@tanstack/react-router'
import { UserHomePage } from '@/components/user-home/UserHomePage'
import { requireAuth } from '@/features/auth/services/require-auth'

export const Route = createFileRoute('/app/')({
  beforeLoad: requireAuth,
  component: UserHomePage,
})