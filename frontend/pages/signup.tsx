import { SignupPage } from '@/features/auth/ui/signup/SignupPage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/signup')({
  component: () => <SignupPage/>,
})

