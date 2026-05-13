import { createFileRoute } from '@tanstack/react-router'
import { CurrentTripPage } from '@/components/current-trip/CurrentTripPage'

export const Route = createFileRoute('/app/')({
  component: CurrentTripPage,
})