import { createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '@/features/auth/services/require-admin'
import { EstudantesPage } from '@/features/admin/ui/students/EstudantesPage'

export const Route = createFileRoute('/admin/estudantes/')({
  beforeLoad: requireAdmin,
  component: EstudantesPage,
})