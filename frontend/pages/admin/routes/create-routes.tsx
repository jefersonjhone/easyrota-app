import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/routes/create-routes')({
  component: () => <div>Hello "/admin/routes/create-routes"!</div>,
})

