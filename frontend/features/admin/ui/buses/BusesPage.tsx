import { AdminLayout } from '@features/admin/ui/Layout'
import { CreateBusForm } from '@features/admin/ui/buses/CreateForm'

export function BusesPage() {
  return (
    <AdminLayout>
      <CreateBusForm />
    </AdminLayout>
  )
}