import { createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '@/features/auth/services/require-admin'
import { ManageDriversPage } from '@/features/admin/ui/drivers/DriversPage'

export const Route = createFileRoute('/admin/motoristas/')({
  beforeLoad: requireAdmin,
  component: ManageDriversPage,
})
