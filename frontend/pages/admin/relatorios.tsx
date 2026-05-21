import { createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '@/features/auth/services/require-admin'

export const Route = createFileRoute('/admin/relatorios')({
  beforeLoad: requireAdmin,
  component: () => <div>Hello "/admin/report"!</div>,
})
