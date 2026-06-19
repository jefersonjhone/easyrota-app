import { createFileRoute } from '@tanstack/react-router'
import AppLayout from '@/lib/layout/app-layout'
import { TripDetailPage } from '@/features/user-home/ui/TripDetailPage'

export const Route = createFileRoute('/app/viagens/$id')({
  component: () => (
    <AppLayout>
      <TripDetailPage />
    </AppLayout>
  )
})
