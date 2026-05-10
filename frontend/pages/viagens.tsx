import { createFileRoute } from '@tanstack/react-router'
import { TripsHomePage } from '@/components/trips/TripsHomePage'

export const Route = createFileRoute('/viagens')({
  component: TripsHomePage,
})
