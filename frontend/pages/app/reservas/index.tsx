import { createFileRoute } from '@tanstack/react-router'
import AppLayout from '@/lib/layout/app-layout'
import { ActiveReservationsPage } from '@/features/user-home/ui/ActiveReservationsPage'

export const Route = createFileRoute('/app/reservas/')({
  component: () => (
    <AppLayout>
      <ActiveReservationsPage />
    </AppLayout>
  )
})
