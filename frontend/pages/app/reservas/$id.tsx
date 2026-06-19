import { createFileRoute } from '@tanstack/react-router'
import AppLayout from '@/lib/layout/app-layout'
import { ReservationDetailPage } from '@/features/user-home/ui/ReservationDetailPage'

export const Route = createFileRoute('/app/reservas/$id')({
  component: () => (
    <AppLayout>
      <ReservationDetailPage />
    </AppLayout>
  )
})
