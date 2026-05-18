import { createFileRoute } from '@tanstack/react-router'

import { DriverTripsPage } from '@/features/Viajem_Motorista/DriverTripsPage'

export const Route = createFileRoute('/app/driver/viagens')({
  component: DriverTripsPage,
})
