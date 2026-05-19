import { createFileRoute } from '@tanstack/react-router'
import { AdminLayout } from '@features/admin/ui/Layout'
import { TripsHistoryPage } from '@features/admin/ui/routes/TripsHistoryPage'

export const Route = createFileRoute('/app/viagens')({
  component: () => (
    <AdminLayout>
      <TripsHistoryPage />
    </AdminLayout>
  ),
})