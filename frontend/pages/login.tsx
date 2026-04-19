/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from '@tanstack/react-router'

import { LoginForms } from './login/LoginForms'
import AuthLayout from '@/components/auth/AuthLayout'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

const paths = {
    createAccount: "/",
    recoverPassword: "/",
}

function LoginPage() {
  return (
    <AuthLayout>
      <LoginForms paths={paths} />
    </AuthLayout>
  )
}
