import RoutesPage from '@/features/admin/ui/routes/RoutesPage'
import { createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '@/features/auth/services/require-admin'

export const Route = createFileRoute('/admin/rotas/')({
  beforeLoad: requireAdmin,
  component: RoutesPage,
})
