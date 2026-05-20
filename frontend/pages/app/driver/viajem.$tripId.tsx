/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from '@tanstack/react-router'

import { ViajemMotorista } from '@/features/ViajemMotorista/ViajemMotorista'

export const Route = createFileRoute('/app/driver/viajem/$tripId')({
  component: DriverTripDetailRoute,
})

function DriverTripDetailRoute() {
  const { tripId } = Route.useParams()

  return <ViajemMotorista tripId={tripId} />
}
