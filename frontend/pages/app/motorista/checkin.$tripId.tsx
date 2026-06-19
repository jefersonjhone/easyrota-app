/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from '@tanstack/react-router'
import { requireProfile } from '@/features/auth/services/require-profile'
import { CheckinPage } from '@/features/ViagemMotorista/CheckinPage'

export const Route = createFileRoute('/app/motorista/checkin/$tripId')({
  beforeLoad: () => requireProfile(['DRIVER', 'ADMIN']),
  component: MotoristaCheckinRoute,
})

function MotoristaCheckinRoute() {
  const { tripId } = Route.useParams()
  return <CheckinPage tripId={tripId} />
}
