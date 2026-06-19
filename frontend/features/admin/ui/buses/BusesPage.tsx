import { apiFetch } from '@/lib/api'
import { useEffect, useState } from 'react'

import { AdminLayout } from '@features/admin/ui/Layout'
import { CreateBusForm } from '@features/admin/ui/buses/CreateForm'
import { BusesTable } from '@features/admin/ui/buses/BusesTable'
import { EditBusModal } from '@features/admin/ui/buses/EditBusModal'
import { Button } from '@ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@ui/dialog'
import { PlusIcon } from '@phosphor-icons/react'

export interface Bus {
  id: string
  number_plate: string
  brand: string
  seating_capacity: number
  status: 'ATIVO' | 'MANUTENÇÃO'
}

export function BusesPage() {
  const [buses, setBuses] = useState<Bus[]>([])
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const deleteBus = async (idBus: string) => {
    try {
      await apiFetch(`/buses/${idBus}/`, {
        method: "DELETE"
      })

      setBuses((prev) =>
        prev.filter((bus) => bus.id !== idBus)
      )
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    async function fetchBuses (){
      try {
        const response = await apiFetch('/buses/', {
          method: 'GET'
        }) as Bus[]

        setBuses(response)
      } catch (err) {
        console.error(err)
      }
    }

    fetchBuses()
  }, [])

  const addBus = (newBus: Bus) => {
    setBuses((prev) => [...prev, newBus])
    setIsDialogOpen(false)
  }

  const handleOpenEditModal = (bus: Bus) => {
    setSelectedBus(bus)
    setIsEditModalOpen(true)
  }

  const handleBusUpdated = (updatedBus: Bus) => {
    setBuses((prev) =>
      prev.map((bus) => (bus.id === updatedBus.id ? updatedBus : bus))
    )
  }
  
  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 p-4 items-start w-full max-w-4xl mx-auto box-border">
        <div className="flex justify-between items-center w-full">
          <h1 className="text-2xl font-bold">Frota de Veículos</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="cursor-pointer">
                <PlusIcon className="mr-2" weight="bold" size={20} />
                Cadastrar Veículo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cadastrar novo veículo</DialogTitle>
              </DialogHeader>
              <CreateBusForm onBusCreated={addBus}/>
            </DialogContent>
          </Dialog>
        </div>
        <BusesTable
          buses={buses}
          onDeleteBus={deleteBus}
          onEditBus={handleOpenEditModal} 
        />
      </div>

      <EditBusModal
        bus={selectedBus}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedBus(null)
        }}
        onBusUpdated={handleBusUpdated}
      />
    </AdminLayout>
  )
}