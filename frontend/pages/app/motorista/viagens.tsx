import { requireProfile } from '@/features/auth/services/require-profile'
import { createFileRoute } from '@tanstack/react-router'
import { DriverTripsPage } from '@/features/Viagem_Motorista/DriverTripsPage'

export const Route = createFileRoute('/app/motorista/viagens')({
  beforeLoad: () => requireProfile(['DRIVER', 'ADMIN']),
  component: DriverTripsPage,
})
