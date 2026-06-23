import { createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '@/features/auth/services/require-admin'
import { ServidoresPage } from '@/features/admin/ui/servants/ServidoresPage'

export const Route = createFileRoute('/admin/servidores/')({
  beforeLoad: requireAdmin,
  component: ServidoresPage,
})