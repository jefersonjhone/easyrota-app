import { CurrentTripPage } from '@/components/current-trip/CurrentTripPage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/viagens/atual')({
  component: CurrentTripPage,
})