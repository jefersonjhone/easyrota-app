import { createFileRoute } from '@tanstack/react-router'
import { getAuthRedirect } from '@/features/auth/services/auth-redirect'
import { LoginPage } from '@features/auth/ui/login/LoginPage'

export const Route = createFileRoute('/app/login')({
  beforeLoad: getAuthRedirect,
  component: LoginPage,
})
