import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/motoristas')({
  component: () => <div>Hello "/admin/drivers"!</div>,
})
