import { createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '@/features/auth/services/require-admin'
import { AdminLayout } from '@/features/admin/ui/Layout'

export const Route = createFileRoute('/admin/admins')({
  beforeLoad: requireAdmin,
  component: () => (
        <AdminLayout>
          Hello "/admin/admins"!
        </AdminLayout>
      ),
})
