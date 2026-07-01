import { createFileRoute } from '@tanstack/react-router'
import { TripRequestsPage } from '@/features/admin/ui/solicitacoes/TripRequestsPage'
import { requireAdmin } from '@/features/auth/services/require-admin'

export const Route = createFileRoute('/admin/solicitacoes')({
  beforeLoad: requireAdmin,
  component: TripRequestsPage,
})
