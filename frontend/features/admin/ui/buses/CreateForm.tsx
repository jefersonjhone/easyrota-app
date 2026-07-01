import { apiFetch } from '@/lib/api'
import { Button } from '@ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@ui/field'
import { Input } from '@ui/input'
import { useForm } from 'react-hook-form'
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from 'sonner'
import type { Bus } from './BusesPage'

const busSchema = z.object({
  number_plate: z.string().min(1, "Placa obrigatória"),
  brand: z.string().min(1, "Marca obrigatória"),
  seating_capacity: z.number().min(1).max(120)
})

type BusData = z.infer<typeof busSchema>

export const CreateBusForm = ({ onBusCreated }: { onBusCreated: (bus: Bus) => void}) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<BusData>({
    resolver: zodResolver(busSchema),
    defaultValues: {
      number_plate: "",
      brand: "",
      seating_capacity: undefined
    },
    mode: "onChange",
  });

  const onSubmit = async (data: BusData) => {
    try {
      const response = await apiFetch('/buses/', {
        method: "POST",
        body: JSON.stringify(data)
      }) as Bus

      onBusCreated(response)
      toast.success('Ônibus cadastrado com sucesso!')
    } catch (err){
      console.error (err);

      const errorData = err as { data?: { detail?: string, number_plate?: string[] } } | undefined
      const detail = errorData?.data?.detail;
      const plateError = errorData?.data?.number_plate?.[0];

      if (plateError){
        setError("number_plate", {message: `${errorData?.data?.number_plate}`})
      }

      if (detail) {
        const message =
        detail &&
        (detail.includes('Given token not valid')
          ? 'Token inválido. Faça login novamente.'
          : detail.includes('Token is invalid')
          ? 'Token inválido ou expirado. Faça login novamente.'
          : detail.includes('credenciais de autenticação')
          ? 'Faça login para acessar esse recurso.'
          : detail)
        || 'Erro ao criar ônibus.'

        toast.error(message)
        setError("root.serverError", {message: message})
      }
    }
  }

  return (
    <div className="w-full">
      {errors.root?.serverError && (
        <FieldDescription className="mb-4 rounded-md bg-red-50 p-3 text-red-700">
          {errors.root.serverError.message}
        </FieldDescription>
      )}

      <div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="plate" className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Placa</FieldLabel>
              <Input {...register("number_plate")} type="text" placeholder="ABC-1234"/>

            {errors.number_plate && (
              <FieldDescription className="text-red-500">
                {errors.number_plate.message}
              </FieldDescription>
            )}
            </Field>

            <Field>
              <FieldLabel htmlFor="brand" className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Modelo</FieldLabel>
              <Input {...register("brand")} type="text" placeholder="Marcopolo Torino"/>

              {errors.brand && (
              <FieldDescription className="text-red-500">
                {errors.brand.message}
              </FieldDescription>
            )}
            </Field>

            <Field>
              <FieldLabel htmlFor="capacity" className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Capacidade</FieldLabel>
              <Input {...register("seating_capacity", {valueAsNumber: true})} type="number" min={1} max={120}
                placeholder="40"
              />
              <FieldDescription>
                A capacidade deve ficar entre 1 e 120 assentos.
              </FieldDescription>
            </Field>

            <Field>
              <Button type="submit" className="cursor-pointer">
                Salvar veículo
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </div>
    </div>
  )
}
