import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/relatorios')({
  component: () => <div>Hello "/admin/report"!</div>,
})
