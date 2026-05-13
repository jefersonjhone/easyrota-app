import { createFileRoute } from '@tanstack/react-router'
import { BusesPage } from '@features/admin/ui/buses/BusesPage'

export const Route = createFileRoute('/admin/onibus')({
  component: BusesPage,
})