import { AdminLayout } from '@features/admin/ui/Layout'
import { CreateBusForm } from '@features/admin/ui/buses/CreateForm'
import { BusesTable } from '@features/admin/ui/buses/BusesTable'

export function BusesPage() {
  return (
    <AdminLayout>
      <div className="flex flex-col lg:flex-row gap-6 p-2 items-start w-full justify-center">
        <CreateBusForm />
        <BusesTable />
      </div>
    </AdminLayout>
  )
}