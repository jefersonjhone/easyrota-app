import { createFileRoute } from '@tanstack/react-router'
import { ProfilePage } from '../../features/user-home/ui/profile'

export const Route = createFileRoute('/app/profile')({
  component: ProfilePage,
})

