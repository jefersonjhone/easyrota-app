import { NotFoundPage } from '@/features/not-found/ui/NotFoundPage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/perfil')({
  component:  NotFoundPage
})

