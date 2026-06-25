import { createFileRoute } from '@tanstack/react-router'
import { BusesPage } from '@features/admin/ui/buses/BusesPage'
import { requireAdmin } from '@/features/auth/services/require-admin'

export const Route = createFileRoute('/app/admin/onibus')({
  beforeLoad: requireAdmin,
  component: BusesPage,
})