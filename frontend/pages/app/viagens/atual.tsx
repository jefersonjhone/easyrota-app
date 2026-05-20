import { CurrentTripPage } from '@/components/current-trip/CurrentTripPage'
import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/features/auth/services/require-auth'

export const Route = createFileRoute('/app/viagens/atual')({
  beforeLoad: requireAuth,
  component: CurrentTripPage,
})