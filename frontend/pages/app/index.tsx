import { createFileRoute } from '@tanstack/react-router'
import { UserHomePage } from '@/components/user-home/UserHomePage'

export const Route = createFileRoute('/app/')({
  component: UserHomePage,
})