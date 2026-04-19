/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from '@tanstack/react-router'

import { LoginForms } from '@/components/auth/login/LoginForms'
import AuthLayout from '@/components/auth/layout/AuthLayout'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

const paths = {
    createAccount: "/signup",
    // TODO: Implementar página de recuperação de senha
    recoverPassword: "/recovery",
}

function LoginPage() {
  return (
    <AuthLayout>
      <LoginForms paths={paths} />
    </AuthLayout>
  )
}
