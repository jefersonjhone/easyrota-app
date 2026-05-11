import { AdminLayout } from '@features/admin/ui/admin-layout'
import { CreateBusForm } from '@features/admin/ui/buses/CreateForm'

export function BusesPage() {
  return (
    <AdminLayout title="Gestão de Frota"
      description="Gerenciamento de veículos e capacidade operacional."
    >
      <CreateBusForm />
    </AdminLayout>
  )
}