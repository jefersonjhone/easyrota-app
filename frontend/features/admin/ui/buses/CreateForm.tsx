import { apiFetch } from '@/lib/api'
import { Button } from '@ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@ui/field'
import { Input } from '@ui/input'
import { useForm } from 'react-hook-form'
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from 'react'

const busSchema = z.object({
  number_plate: z.string().min(1, "Placa obrigatória"),
  brand: z.string().min(1, "Marca obrigatória"),
  seating_capacity: z.number().min(1).max(120)
})

type BusData = z.infer<typeof busSchema>

export const CreateBusForm = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BusData>({
    resolver: zodResolver(busSchema),
  });
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const onSubmit = async (data: BusData) => {
    setSuccess(null)
    setError(null)

    try {
      await apiFetch('/buses/', {
        method: "POST",
        body: JSON.stringify(data)
      })

      setSuccess("Ônibus cadastrado com sucesso!")

      reset()
    } catch (err){
      console.error (err);

      const errorData = err as { data?: { detail?: string, number_plate?: string[] } } | undefined

      const detail = errorData?.data?.detail;
      const plateError = errorData?.data?.number_plate?.[0];

      const message =
        detail &&
        (plateError
          ? 'A placa inserida já está cadastrada.'
          : detail.includes('Given token not valid')
          ? 'Token inválido. Faça login novamente.'
          : detail.includes('Token is invalid')
          ? 'Token inválido ou expirado. Faça login novamente.'
          : detail.includes('Authentication credentials')
          ? 'Faça login para acessar esse recurso.'
          : detail)
        || 'Erro ao criar ônibus.'
        setError(message)
    }
  }

  return (
    <Card className="w-full max-w-2xl m-4">
      <CardHeader>
        <CardTitle>Cadastrar novo veículo</CardTitle>
        <CardDescription>
          Informe placa, modelo e capacidade para registrar um ônibus na frota.
        </CardDescription>
      </CardHeader>

      {error && (
        <FieldDescription className="mb-4 rounded-md bg-red-50 p-3 text-red-700">
          {error}
        </FieldDescription>
      )}
      
      {success && (
        <FieldDescription className="mb-4 rounded-md bg-green-50 p-3 text-green-700">
          {success}
        </FieldDescription>
      )}

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="plate">Placa</FieldLabel>
              <Input {...register("number_plate")} type="text" placeholder="ABC-1234"/>

            {errors.number_plate && (
              <FieldDescription className="text-red-500">
                {errors.number_plate.message}
              </FieldDescription>
            )}
            </Field>

            <Field>
              <FieldLabel htmlFor="brand">Modelo</FieldLabel>
              <Input {...register("brand", {valueAsNumber: true})} type="text" placeholder="Marcopolo Torino"/>

              {errors.brand && (
              <FieldDescription className="text-red-500">
                {errors.brand.message}
              </FieldDescription>
            )}
            </Field>

            <Field>
              <FieldLabel htmlFor="capacity">Capacidade</FieldLabel>
              <Input {...register("seating_capacity")} type="number" min={1} max={120}
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
      </CardContent>
    </Card>
  )
}
