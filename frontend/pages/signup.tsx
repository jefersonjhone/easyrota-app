/* eslint-disable react-refresh/only-export-components */
import AuthLayout from '@/components/auth/AuthLayout'
import { SignupForm } from '@/components/auth/SignupForms'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/signup')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <AuthLayout>
        <SignupForm></SignupForm>
    </AuthLayout>
  )
}
