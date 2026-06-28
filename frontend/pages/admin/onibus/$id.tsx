import { createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '@/features/auth/services/require-admin'
import { BusDetailPage } from '@/features/admin/ui/buses/BusDetailPage'

export const Route = createFileRoute('/admin/onibus/$id')({
  beforeLoad: requireAdmin,
  component: BusDetailPage,
})
