import { createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '@/features/auth/services/require-admin'
import { TripsPage } from '@/features/admin/ui/routes/TripsPage' 

export const Route = createFileRoute('/admin/viagens')({
  beforeLoad: requireAdmin,
  component: TripsPage
})