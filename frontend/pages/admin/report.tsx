import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/report')({
  component: () => <div>Hello "/admin/report"!</div>,
})
