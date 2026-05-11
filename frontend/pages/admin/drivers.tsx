import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/drivers')({
  component: () => <div>Hello "/admin/drivers"!</div>,
})
