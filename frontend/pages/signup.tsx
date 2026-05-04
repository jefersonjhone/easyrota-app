import { createFileRoute } from '@tanstack/react-router'
import { SignupPage } from '@features/auth/ui/signup/SignupPage'

export const Route = createFileRoute('/signup')({
  component: () => <SignupPage/>,
})

