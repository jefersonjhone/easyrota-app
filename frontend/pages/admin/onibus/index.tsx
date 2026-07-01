import { createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '@/features/auth/services/require-admin'
import { BusesPage } from '@features/admin/ui/buses/BusesPage'

export const Route = createFileRoute('/admin/onibus/')({
  beforeLoad: requireAdmin,
  component: BusesPage,
})
