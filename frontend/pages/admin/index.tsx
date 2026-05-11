import AdminPage from '@/features/admin/ui'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/')({
  component: AdminPage
})
