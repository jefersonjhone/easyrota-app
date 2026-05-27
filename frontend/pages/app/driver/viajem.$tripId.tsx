/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from '@tanstack/react-router'
import { requireProfile } from '@/features/auth/services/require-profile'
import { ViajemMotorista } from '@/features/ViajemMotorista/ViajemMotorista'

export const Route = createFileRoute('/app/driver/viajem/$tripId')({
  beforeLoad: () => requireProfile(['DRIVER', 'ADMIN']),
  component: DriverTripDetailRoute,
})

function DriverTripDetailRoute() {
  const { tripId } = Route.useParams()

  return <ViajemMotorista tripId={tripId} />
}
