import { createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '@/features/auth/services/require-admin'
import { AdminProfilePage } from '@/features/admin/ui/profile/AdminProfilePage'

export const Route = createFileRoute('/admin/perfil')({
  beforeLoad: requireAdmin,
  component: AdminProfilePage,
})
