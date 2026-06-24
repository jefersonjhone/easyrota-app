import { apiFetch } from '@/lib/api'
import { useEffect, useState } from 'react'

import { AdminLayout } from '@features/admin/ui/Layout'
import { CreateBusForm } from '@features/admin/ui/buses/CreateForm'
import { BusesTable } from '@features/admin/ui/buses/BusesTable'
import { EditBusModal } from '@features/admin/ui/buses/EditBusModal'
import { Button } from '@ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@ui/dialog'
import { MagnifyingGlassIcon, PlusIcon } from '@phosphor-icons/react'

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
  const [search, setSearch] = useState('')

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
      <section className="mx-auto w-full max-w-5xl px-4 py-6 space-y-6">
        <div className="flex justify-between items-center w-full">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
              Frota e Pessoal
            </p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              Frota de Veículos
            </h1>
          </div>
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

        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Busca</label>
            <div className="relative">
              <MagnifyingGlassIcon size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Placa, modelo ou marca..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-40 rounded-md border border-border bg-card pl-8 pr-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 placeholder:text-muted-foreground/60"
              />
            </div>
          </div>
        </div>

        {(() => {
          const q = search.toLowerCase().trim()
          const filtered = q
            ? buses.filter((b) =>
                b.number_plate.toLowerCase().includes(q) ||
                b.brand.toLowerCase().includes(q)
              )
            : buses
          return (
            <BusesTable
              buses={filtered}
              onDeleteBus={deleteBus}
              onEditBus={handleOpenEditModal}
            />
          )
        })()}
      </section>

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