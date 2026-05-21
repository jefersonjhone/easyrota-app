import { createFileRoute } from '@tanstack/react-router'
import { ManageDriversPage } from '@/features/admin/ui/drivers/DriversPage'
import { requireAdmin } from '@/features/auth/services/require-admin'

export const Route = createFileRoute('/admin/motoristas')({
  beforeLoad: requireAdmin,
  component: ManageDriversPage,
})
