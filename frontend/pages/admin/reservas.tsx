import { createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '@/features/auth/services/require-admin'
import { ReservasPage } from '@/features/admin/ui/reservations/ReservasPage'

export const Route = createFileRoute('/admin/reservas')({
  beforeLoad: requireAdmin,
  component: ReservasPage,
})
