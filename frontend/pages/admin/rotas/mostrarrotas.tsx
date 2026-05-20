import ShowRoutesPage from '@/features/admin/ui/routes/show-routes/ShowRoutesPage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/rotas/mostrarrotas')({
  component: ShowRoutesPage
,
})

