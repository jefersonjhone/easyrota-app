import { createFileRoute } from '@tanstack/react-router'
import { TripsHistoryPage } from '@features/admin/ui/routes/TripsHistoryPage'
import { requireAuth } from '@/features/auth/services/require-auth'
import AppLayout from '@/lib/layout/app-layout'

export const Route = createFileRoute('/app/viagens/historico')({
  beforeLoad: requireAuth,
  component: () => (
    <AppLayout>
      <TripsHistoryPage />
    </AppLayout>
  )
})