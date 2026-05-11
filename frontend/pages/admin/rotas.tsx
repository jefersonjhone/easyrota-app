import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/rotas')({
  component: () => <div>Hello "/admin/routes"!</div>,
})
