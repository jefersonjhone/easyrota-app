import { Toolbar } from '@/features/admin/ui/Toolbar'
import AppLayout from '@/lib/layout/app-layout'
import { CreateBusForm } from '@features/admin/ui/buses/CreateForm'

export function BusesPage() {
  return (
    <AppLayout>
      <Toolbar></Toolbar>
      <main className="flex w-full flex-col items-center justify-start gap-4">
        <CreateBusForm />
      </main>
    </AppLayout>
  )
}