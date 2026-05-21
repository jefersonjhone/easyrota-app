import RoutesPage from '@/features/admin/ui/routes/RoutesPage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/rotas')({
  component: RoutesPage,
})
