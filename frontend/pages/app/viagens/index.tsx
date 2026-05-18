import { createFileRoute } from '@tanstack/react-router'
import { TripsHomePage } from '@/components/trips/TripsHomePage'
import { requireAuth } from '@/features/auth/services/require-auth'

export const Route = createFileRoute('/app/viagens/')({
  beforeLoad: requireAuth,
  component: TripsHomePage,
})
