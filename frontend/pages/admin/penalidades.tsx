import { createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '@/features/auth/services/require-admin'
import { PenaltiesPage } from '@/features/admin/ui/penalties/PenaltiesPage'

export const Route = createFileRoute('/admin/penalidades')({
  beforeLoad: requireAdmin,
  component: PenaltiesPage,
})
