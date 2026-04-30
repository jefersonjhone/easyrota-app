/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from '@tanstack/react-router'

import { LoginForms } from '@/components/auth/login/LoginForms'
import AuthLayout from '@/components/auth/layout/AuthLayout'
import { routes } from '@/routes'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  return (
    <AuthLayout>
      <LoginForms paths={{
        createAccount: routes.auth.signup(),
        recoverPassword: routes.auth.recovery()
      }} />
    </AuthLayout>
  )
}
