import { createFileRoute } from '@tanstack/react-router'
import { AdminLayout } from '@features/admin/ui/Layout'
import { TripsHistoryPage } from '@features/admin/ui/routes/TripsHistoryPage'
import { requireAuth } from '@/features/auth/services/require-auth'

export const Route = createFileRoute('/admin/viagens')({
  beforeLoad: requireAuth,
  component: () => (
    <AdminLayout>
      <TripsHistoryPage />
    </AdminLayout>
  ),
})