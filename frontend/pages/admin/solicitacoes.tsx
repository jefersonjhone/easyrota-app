import { createFileRoute } from '@tanstack/react-router'
import { TripRequestsPage } from '@/features/admin/ui/solicitacoes/TripRequestsPage'

export const Route = createFileRoute('/admin/solicitacoes')({
  component: TripRequestsPage,
})
