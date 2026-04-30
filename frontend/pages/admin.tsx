/* eslint-disable react-refresh/only-export-components */
import AdminMenu from '@/components/admin/AdminMenu'
import AppLayout from '@/components/layout/app-layout'
import { routes } from '@/routes'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <AppLayout>
      <AdminMenu paths={{
        travel: routes.admin.travel(),
        buses: routes.admin.buses(),
        drivers: routes.admin.drivers(),
        routes: routes.admin.routes(),
        admins: routes.admin.admins(),
        analytics: routes.admin.reports(),
      }} />
    </AppLayout>
  )
}
