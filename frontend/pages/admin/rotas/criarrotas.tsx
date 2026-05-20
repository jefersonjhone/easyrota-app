import CreateRoutePage from '@/features/admin/ui/routes/create-routes/CreateRoutePage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/rotas/criarrotas')({
  component: () => CreateRoutePage(),
})

