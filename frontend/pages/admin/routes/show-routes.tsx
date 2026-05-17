import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/routes/show-routes')({
  component: () => <div>Hello "/admin/routes/show-routes"!</div>
,
})

