import { createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '@/features/auth/services/require-admin'
import { TripDetailPage } from '@/features/admin/ui/routes/TripDetailPage'

export const Route = createFileRoute('/admin/viagens/$id')({
  beforeLoad: requireAdmin,
  component: TripDetailPage,
})
