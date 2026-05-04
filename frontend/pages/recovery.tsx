/* eslint-disable react-refresh/only-export-components */
import AuthLayout from '@/features/auth/ui/AuthLayout'
import { RecoveryForms } from '@/features/auth/ui/recovery/RecoveryForms'
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
