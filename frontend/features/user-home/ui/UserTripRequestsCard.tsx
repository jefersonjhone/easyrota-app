import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/ui/card'
import { Button } from '@/lib/ui/button'
import { Plus, ArrowsClockwise } from '@phosphor-icons/react'
import { useTripRequests } from '@/features/trips/hooks/useTripRequests'
import { Field, FieldLabel } from '@/lib/ui/field'
import { Input } from '@/lib/ui/input'
import { useCreateTripRequest } from '@/features/trips/hooks/useTripRequests'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  origin_text: z.string().nonempty('Obrigatório'),
  destiny_text: z.string().nonempty('Obrigatório'),
  departure_date: z.string().nonempty('Obrigatório'),
  departure_time: z.string().nonempty('Obrigatório'),
  return_time: z.string().optional(),
  reason: z.string().nonempty('Obrigatório'),
})
type Schema = z.infer<typeof schema>

export function UserTripRequestsCard() {
  const { data: requests, isLoading } = useTripRequests()
  const createMutation = useCreateTripRequest()
  const [isCreating, setIsCreating] = useState(false)

  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: {
      origin_text: '',
      destiny_text: '',
      departure_date: '',
      departure_time: '',
      return_time: '',
      reason: '',
    },
  })

  const onSubmit = async (data: Schema) => {
    await createMutation.mutateAsync(data)
    setIsCreating(false)
    form.reset()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APROVADA':
        return <span className="inline-flex items-center rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white">Aprovada</span>
      case 'RECUSADA':
        return <span className="inline-flex items-center rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white">Recusada</span>
      default:
        return <span className="inline-flex items-center rounded-md bg-gray-200 px-2 py-1 text-xs font-medium text-gray-800">Pendente</span>
    }
  }

  return (
    <Card className="flex flex-col border-border/40 shadow-sm mt-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-heading text-foreground">
          Solicitações de Viagem
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => setIsCreating(!isCreating)}>
          {isCreating ? 'Cancelar' : <><Plus className="mr-2 h-4 w-4" /> Solicitar</>}
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
        {isCreating ? (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Origem</FieldLabel>
                <Input {...form.register('origin_text')} placeholder="Ex: UEFS" />
              </Field>
              <Field>
                <FieldLabel>Destino</FieldLabel>
                <Input {...form.register('destiny_text')} placeholder="Ex: Salvador, BA" />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Field>
                <FieldLabel>Data</FieldLabel>
                <Input type="date" {...form.register('departure_date')} />
              </Field>
              <Field>
                <FieldLabel>Saída</FieldLabel>
                <Input type="time" {...form.register('departure_time')} />
              </Field>
              <Field>
                <FieldLabel>Retorno</FieldLabel>
                <Input type="time" {...form.register('return_time')} />
              </Field>
            </div>
            <Field>
              <FieldLabel>Motivo da Viagem (Justificativa)</FieldLabel>
              <Input {...form.register('reason')} placeholder="Ex: Aula de campo da disciplina X" />
            </Field>
            <Button type="submit" disabled={createMutation.isPending} className="w-full">
              {createMutation.isPending ? <ArrowsClockwise className="animate-spin" /> : 'Enviar Solicitação'}
            </Button>
          </form>
        ) : isLoading ? (
          <div className="text-center text-sm text-muted-foreground py-4">Carregando...</div>
        ) : !requests || requests.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-4">Nenhuma solicitação encontrada.</div>
        ) : (
          <div className="space-y-4">
            {requests.map(req => (
              <div key={req.id} className="border rounded-md p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{req.origin_text} → {req.destiny_text}</p>
                    <p className="text-xs text-muted-foreground">
                      {req.departure_date} às {req.departure_time}
                    </p>
                  </div>
                  {getStatusBadge(req.status)}
                </div>
                {req.status === 'RECUSADA' && req.feedback && (
                  <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
                    Motivo: {req.feedback}
                  </p>
                )}
                {req.status === 'APROVADA' && (
                  <div className="mt-2 text-sm bg-muted/50 p-3 rounded flex flex-col gap-2">
                    <p className="text-xs font-semibold text-primary">Aprovada! Compartilhe com os alunos:</p>
                    <div className="flex items-center gap-2">
                      <Input readOnly value={`${window.location.origin}/app/viagens/privada?code=${req.access_code || '---'}`} className="h-8 text-xs font-mono" />
                      <Button size="sm" variant="secondary" onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/app/viagens/privada?code=${req.access_code}`)
                        alert('Copiado!')
                      }}>
                        Copiar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
