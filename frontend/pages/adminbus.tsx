import { createFileRoute } from '@tanstack/react-router'
import { BusPage } from '../features/admin/ui/bus-page'

export const Route = createFileRoute('/adminbus')({
  component: BusPage,
})