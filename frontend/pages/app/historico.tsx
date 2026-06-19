import { createFileRoute } from '@tanstack/react-router'
import { TripsHistoryPage } from '@features/admin/ui/routes/TripsHistoryPage'
import AppLayout from '@/lib/layout/app-layout'

export const Route = createFileRoute('/app/historico')({
  component: () => (
    <AppLayout>
      <TripsHistoryPage />
    </AppLayout>
  )
})
