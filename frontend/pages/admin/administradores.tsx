import { createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '@/features/auth/services/require-admin'
import { AdminsPage } from '@/features/admin/ui/admins/AdminsPage'

export const Route = createFileRoute('/admin/administradores')({
  beforeLoad: requireAdmin,
  component: AdminsPage,
})
