/* eslint-disable react-refresh/only-export-components */
import AuthLayout from '@/features/auth/ui/AuthLayout'
import { SignupForm } from '@/features/auth/ui/signup/SignupPage'
import { createFileRoute } from '@tanstack/react-router'

import { routes } from '@/routes'

export const Route = createFileRoute('/signup')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <AuthLayout>
        <SignupForm paths={{
          login: routes.auth.login()
        }} />
    </AuthLayout>
  )
}
