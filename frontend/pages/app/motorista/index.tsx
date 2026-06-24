import { createFileRoute } from '@tanstack/react-router'
import { requireProfile } from '@/features/auth/services/require-profile'
import { MotoristaHomePage } from '@/features/Viagem_Motorista/MotoristaHomePage'


export const Route = createFileRoute('/app/motorista/')({
  beforeLoad: () => requireProfile(['DRIVER', 'ADMIN']),
  component: MotoristaHomePage,
})
