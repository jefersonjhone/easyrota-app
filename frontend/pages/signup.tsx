/* eslint-disable react-refresh/only-export-components */
import AuthLayout from '@/components/auth/layout/AuthLayout'
import { SignupForm } from '@/components/auth/signup/SignupForms'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/signup')({
  component: RouteComponent,
})

const paths = {
    login: "/login",
}

function RouteComponent() {
  return (
    <AuthLayout>
        <SignupForm paths={paths} />
    </AuthLayout>
  )
}
