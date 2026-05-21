import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/features/auth/services/require-auth'
import { AdminLayout } from '@/features/admin/ui/Layout'
import { TripsPage } from '@/features/admin/ui/routes/TripsPage' 

export const Route = createFileRoute('/admin/trips')({
  beforeLoad: requireAuth,
  component: () => (
    <AdminLayout>
      <TripsPage />
    </AdminLayout>
  ),
})