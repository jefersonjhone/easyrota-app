import { createFileRoute } from '@tanstack/react-router'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { ProfilePage } from '../../features/user-home/ui/ProfilePage'
import { MotoristaProfilePage } from '@/features/perfil/MotoristaProfilePage'

function PerfilRoute() {
  const user = useAuthStore((s) => s.user)

  if (user?.profile_type === 'DRIVER') {
    return <MotoristaProfilePage />
  }

  return <ProfilePage />
}

export const Route = createFileRoute('/app/perfil')({
  component: PerfilRoute,
})

