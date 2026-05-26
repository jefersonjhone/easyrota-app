import { createFileRoute } from '@tanstack/react-router'
import { ProfilePage } from '../../features/user-home/ui/ProfilePage'

export const Route = createFileRoute('/app/perfil')({
  component: ProfilePage,
})

