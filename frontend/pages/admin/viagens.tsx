import { Outlet, createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '@/features/auth/services/require-admin'

export const Route = createFileRoute('/admin/viagens')({
  beforeLoad: requireAdmin,
  component: () => <Outlet />,
})
