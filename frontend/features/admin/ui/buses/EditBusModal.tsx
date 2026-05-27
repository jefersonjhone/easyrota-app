import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { apiFetch } from '@/lib/api'
import { Button } from '@ui/button'
import type { Bus } from './BusesPage'

const editBusSchema = z.object({
  number_plate: z.string().min(1, "Placa obrigatória"),
  brand: z.string().min(1, "Marca obrigatória"),
  seating_capacity: z.number(
    "Capacidade é obrigatória."
  )
  .min(1, "Mínimo 1 assento").max(120, "Máximo 120 assentos"),
  status: z.enum(['ATIVO', 'MANUTENÇÃO'])
})

type EditBusData = z.infer<typeof editBusSchema>

interface EditBusModalProps {
  bus: Bus | null
  isOpen: boolean
  onClose: () => void
  onBusUpdated: (updatedBus: Bus) => void
}

export const EditBusModal = ({ bus, isOpen, onClose, onBusUpdated }: EditBusModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EditBusData>({
    resolver: zodResolver(editBusSchema),
    mode: "onChange"
  })

  useEffect(() => {
    if (bus) {
      reset({
        number_plate: bus.number_plate,
        brand: bus.brand,
        seating_capacity: bus.seating_capacity,
        status: bus.status
      })
    }
  }, [bus, reset])

  if (!isOpen || !bus) return null

  const onSubmit = async (data: EditBusData) => {
    try {
      const response = await apiFetch(`/buses/${bus.id}/`, {
        method: "PUT",
        body: JSON.stringify(data)
      }) as Bus

      onBusUpdated(response)
      onClose()
    } catch (err) {
      console.error(err)
      const errorData = err as { data?: { detail?: string, number_plate?: string[] } } | undefined
      const plateError = errorData?.data?.number_plate?.[0]

      if (plateError) {
        setError("number_plate", { message: "A placa inserida já está cadastrada." })
      } else {
        setError("root.serverError", { message: "Erro ao atualizar os dados do veículo." })
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-background border border-border rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">Editar veículo</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Altere as informações necessárias para atualizar o ônibus na frota.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto space-y-4 flex-1">
          {errors.root?.serverError && (
            <div className="text-sm text-red-500 font-medium mb-2">
              {errors.root.serverError.message}
            </div>
          )}

          <div className="flex flex-col gap-4">
            {/* Campo: Placa */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit_plate" className="text-sm font-medium text-foreground">Placa</label>
              <input 
                {...register("number_plate")} 
                type="text" 
                id="edit_plate" 
                placeholder="ABC-1234"
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {errors.number_plate && (
                <span className="text-xs text-red-500 font-medium">{errors.number_plate.message}</span>
              )}
            </div>

            {/* Campo: Modelo */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit_brand" className="text-sm font-medium text-foreground">Modelo</label>
              <input 
                {...register("brand")} 
                type="text" 
                id="edit_brand" 
                placeholder="Marcopolo Torino"
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {errors.brand && (
                <span className="text-xs text-red-500 font-medium">{errors.brand.message}</span>
              )}
            </div>

            {/* Campo: Capacidade */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit_capacity" className="text-sm font-medium text-foreground">Capacidade</label>
              <input 
                {...register("seating_capacity", { valueAsNumber: true })} 
                type="number" 
                id="edit_capacity" 
                placeholder="40"
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {errors.seating_capacity && (
                <span className="text-xs text-red-500 font-medium">{errors.seating_capacity.message}</span>
              )}
            </div>

            {/* Campo: Status */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit_status" className="text-sm font-medium text-foreground">Status</label>
              <select
                {...register("status")}
                id="edit_status"
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none cursor-pointer"
              >
                <option value="ATIVO">Ativo</option>
                <option value="MANUTENÇÃO">Manutenção</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-6">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isSubmitting} 
              className="h-10 px-4 py-2 rounded-md bg-transparent hover:bg-muted text-foreground border border-border text-sm font-medium transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <Button type="submit" disabled={isSubmitting} className="cursor-pointer bg-[#b84d05] hover:bg-[#963e04] text-white font-medium">
              {isSubmitting ? "Salvando..." : "Salvar veículo"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}