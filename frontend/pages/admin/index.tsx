import AdminPage from '@/features/admin/ui/main/AdminPage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/')({
  component: AdminPage
})
