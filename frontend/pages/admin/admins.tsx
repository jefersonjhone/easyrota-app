import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/admins')({
  component: () => <div>Hello "/admin/admins"!</div>,
})
