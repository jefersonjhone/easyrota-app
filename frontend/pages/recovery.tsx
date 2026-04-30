/* eslint-disable react-refresh/only-export-components */
import AuthLayout from '@/components/auth/layout/AuthLayout'
import { RecoveryForms } from '@/components/auth/recovery/RecoveryForms'
import { routes } from '@/routes'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/recovery')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <AuthLayout>
      <RecoveryForms paths={{
        login: routes.auth.login()
      }}/>
    </AuthLayout>
  )
}
