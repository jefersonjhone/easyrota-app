/* eslint-disable react-refresh/only-export-components */
import AuthLayout from '@/components/auth/layout/AuthLayout'
import { RecoveryForms } from '@/components/auth/recovery/RecoveryForms'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/recovery')({
  component: RouteComponent,
})

const paths = {
    login: "/login",
}

function RouteComponent() {
  return (
    <AuthLayout>
      <RecoveryForms paths={paths}/>
    </AuthLayout>
  )
}
