import { createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '@/features/auth/services/require-admin'

export const Route = createFileRoute('/admin/admins')({
  beforeLoad: requireAdmin,
  component: () => <div>Hello "/admin/admins"!</div>,
})
