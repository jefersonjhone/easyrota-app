import { createFileRoute } from '@tanstack/react-router'
import { ManageDriversPage } from '@/features/admin/ui/drivers/DriversPage'

export const Route = createFileRoute('/admin/motoristas')({
  component: ManageDriversPage,
})
