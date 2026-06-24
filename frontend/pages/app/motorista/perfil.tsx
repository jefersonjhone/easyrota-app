import { createFileRoute } from '@tanstack/react-router'
import { requireProfile } from '@/features/auth/services/require-profile'
import { MotoristaProfilePage } from '@/features/perfil/MotoristaProfilePage'

export const Route = createFileRoute('/app/motorista/perfil')({
  beforeLoad: () => requireProfile(['DRIVER', 'ADMIN']),
  component: MotoristaProfilePage,
})
