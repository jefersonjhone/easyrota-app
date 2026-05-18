import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/rotas/criarrotas')({
  component: () => <div>Hello "/admin/routes/create-routes"!</div>,
})

