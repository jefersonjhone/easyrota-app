import { apiFetch } from '@/lib/api'
import { useEffect, useState } from 'react'

import { AdminLayout } from '@features/admin/ui/Layout'
import { CreateBusForm } from '@features/admin/ui/buses/CreateForm'
import { BusesTable } from '@features/admin/ui/buses/BusesTable'

export interface Bus {
  id: number
  number_plate: string
  brand: string
  seating_capacity: number
  status: 'active' | 'maintenance'
}

export function BusesPage() {
  const [buses, setBuses] = useState<Bus[]>([])

  const loadBuses = async () => {
    try {
      const response = await apiFetch('/buses/', {
        method: 'GET'
      }) as Bus[]

      setBuses(response)
    } catch (err) {
      console.error(err)
    }
  }

  const deleteBus = async (idBus: number) => {
    try {
      await apiFetch(`/buses/${idBus}/`, {
        method: "DELETE"
      })

      setBuses((prev) =>
        prev.filter((bus) => bus.id !== idBus)
      )
    } catch (err) {
      console.error (err);
    }
  }

  useEffect(() => {
    loadBuses()
  }, [])

  const addBus = (newBus: Bus) => {
    setBuses((prev) => [...prev, newBus])
  }
  
  return (
    <AdminLayout>
      <div className="flex flex-col lg:flex-row gap-6 p-2 items-start w-full justify-center">
        <CreateBusForm onBusCreated={addBus}/>
        <BusesTable
         buses={buses}
         onDeleteBus={deleteBus}/>
      </div>
    </AdminLayout>
  )
}