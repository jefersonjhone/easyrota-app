import { createFileRoute } from '@tanstack/react-router'
import { requireProfile } from '@/features/auth/services/require-profile'
import { ViagemMotorista } from '@/features/ViagemMotorista/ViagemMotorista'

export const Route = createFileRoute('/app/motorista/viagem/$tripId')({
  beforeLoad: () => requireProfile(['DRIVER']),
  component: MotoristaTripDetailRoute,
})

function MotoristaTripDetailRoute() {
  const { tripId } = Route.useParams()

  return <ViagemMotorista tripId={tripId} />
}
