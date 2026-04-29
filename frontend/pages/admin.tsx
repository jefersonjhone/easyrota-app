/* eslint-disable react-refresh/only-export-components */
import AdminMenu from '@/components/admin/AdminMenu'
import AppLayout from '@/components/layout/app-layout'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <AppLayout>
      <AdminMenu />
    </AppLayout>
  )
}
