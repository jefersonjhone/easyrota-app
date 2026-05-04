/* eslint-disable react-refresh/only-export-components */
import AuthLayout from '@/features/auth/ui/AuthLayout'
import { SignupPage } from '@/features/auth/ui/signup/SignupPage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/signup')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <AuthLayout>
        <SignupPage/>
    </AuthLayout>
  )
}
