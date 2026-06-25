import AdminPage from '@/features/admin/ui/main/AdminPage'
import { createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '@/features/auth/services/require-admin'

export const Route = createFileRoute('/app/admin/')({
  beforeLoad: requireAdmin,
  component: AdminPage
})
