import { createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '@/features/auth/services/require-admin'
import { DriverDetailPage } from '@/features/admin/ui/drivers/DriverDetailPage'

export const Route = createFileRoute('/admin/motoristas/$id')({
  beforeLoad: requireAdmin,
  component: DriverDetailPage,
})
