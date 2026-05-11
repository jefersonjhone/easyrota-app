import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/routes')({
  component: () => <div>Hello "/admin/routes"!</div>,
})
