/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from '@tanstack/react-router'

import { LoginPage } from '@features/auth/ui/login/LoginPage'

export const Route = createFileRoute('/login')({
  component: LoginRouteComponent,
})

function LoginRouteComponent() {
  return <LoginPage />
}
