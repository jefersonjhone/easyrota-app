import { useTripRequests, useApproveTripRequest, useRejectTripRequest } from '@/features/trips/hooks/useTripRequests'
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/ui/card'
import { Button } from '@/lib/ui/button'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/lib/ui/dialog'
import { Field, FieldLabel } from '@/lib/ui/field'
import { Input } from '@/lib/ui/input'
import { useBuses, useRoutes } from '@/features/trips/hooks/useTrips'
import type { TripRequest } from '@/features/trips/types'
import { AdminLayout } from '../Layout'

export function TripRequestsPage() {
  const { data: requests, isLoading } = useTripRequests()
  const approveMutation = useApproveTripRequest()
  const rejectMutation = useRejectTripRequest()

  const [selectedRequest, setSelectedRequest] = useState<TripRequest | null>(null)
  const [modalType, setModalType] = useState<'APPROVE' | 'REJECT' | null>(null)

  // Modais Forms
  const { data: buses } = useBuses()
  const { data: routes } = useRoutes()

  const [selectedBus, setSelectedBus] = useState<string>('')
  const [selectedRoute, setSelectedRoute] = useState<string>('')
  const [feedback, setFeedback] = useState<string>('')

  const handleApprove = async () => {
    if (!selectedRequest || !selectedBus || !selectedRoute) return
    await approveMutation.mutateAsync({
      id: selectedRequest.id,
      payload: {
        bus_id: Number(selectedBus),
        route_id: Number(selectedRoute),
      }
    })
    setModalType(null)
  }

  const handleReject = async () => {
    if (!selectedRequest || !feedback) return
    await rejectMutation.mutateAsync({
      id: selectedRequest.id,
      payload: { feedback }
    })
    setModalType(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APROVADA': return <span className="inline-flex items-center rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white">Aprovada</span>
      case 'RECUSADA': return <span className="inline-flex items-center rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white">Recusada</span>
      default: return <span className="inline-flex items-center rounded-md bg-gray-200 px-2 py-1 text-xs font-medium text-gray-800">Pendente</span>
    }
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Solicitações de Viagens</h1>
        {isLoading ? (
          <p>Carregando solicitações...</p>
        ) : (
          <div className="grid gap-4">
            {requests?.map(req => (
              <Card key={req.id}>
                <CardHeader className="flex flex-row justify-between items-start pb-2">
                  <div>
                    <CardTitle className="text-lg">
                      {req.origin_text} → {req.destiny_text}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Solicitante: <span className="font-medium text-foreground">{req.requester_name}</span>
                    </p>
                  </div>
                  {getStatusBadge(req.status)}
                </CardHeader>
                <CardContent>
                  <div className="text-sm mb-4">
                    <p><strong>Data:</strong> {req.departure_date} às {req.departure_time} {req.return_time && `(Retorno: ${req.return_time})`}</p>
                    <p><strong>Motivo:</strong> {req.reason}</p>
                  </div>
                  {req.status === 'PENDENTE' && (
                    <div className="flex gap-2">
                      <Button variant="default" onClick={() => { setSelectedRequest(req); setModalType('APPROVE') }}>
                        Avaliar e Aprovar
                      </Button>
                      <Button variant="destructive" onClick={() => { setSelectedRequest(req); setModalType('REJECT') }}>
                        Recusar
                      </Button>
                    </div>
                  )}
                  {req.status === 'RECUSADA' && req.feedback && (
                    <div className="bg-red-50 text-red-700 p-2 text-sm rounded">
                      <strong>Feedback:</strong> {req.feedback}
                    </div>
                  )}
                  {req.status === 'APROVADA' && (
                    <div className="bg-green-50 text-green-700 p-2 text-sm rounded">
                      <strong>Código de Acesso (Privada):</strong> {req.access_code || '---'}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {(!requests || requests.length === 0) && (
              <p className="text-muted-foreground">Nenhuma solicitação encontrada.</p>
            )}
          </div>
        )}

        {/* Modal Approve */}
        <Dialog open={modalType === 'APPROVE'} onOpenChange={(open) => !open && setModalType(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Aprovar Viagem de Campo</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">Para aprovar esta viagem de campo/municipal, vincule uma Rota (que pode ser criada na aba Rotas caso não exista) e um Ônibus.</p>
              <Field>
                <FieldLabel>Selecione o Ônibus</FieldLabel>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" value={selectedBus} onChange={e => setSelectedBus(e.target.value)}>
                  <option value="">Selecione...</option>
                  {buses?.map(bus => (
                    <option key={bus.id} value={String(bus.id)}>{bus.number_plate} - {bus.brand} ({bus.seating_capacity} vagas)</option>
                  ))}
                </select>
              </Field>
              <Field>
                <FieldLabel>Selecione a Rota Oficial</FieldLabel>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" value={selectedRoute} onChange={e => setSelectedRoute(e.target.value)}>
                  <option value="">Selecione...</option>
                  {routes?.map(route => (
                    <option key={route.id} value={String(route.id)}>{route.origin} → {route.destiny} ({route.departure_time})</option>
                  ))}
                </select>
              </Field>
              <Button onClick={handleApprove} className="w-full" disabled={!selectedBus || !selectedRoute || approveMutation.isPending}>
                Aprovar e Criar Viagem Oculta
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Reject */}
        <Dialog open={modalType === 'REJECT'} onOpenChange={(open) => !open && setModalType(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Recusar Solicitação</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <Field>
                <FieldLabel>Motivo da Recusa (Feedback)</FieldLabel>
                <Input placeholder="Ex: Não temos ônibus disponíveis para esta data." value={feedback} onChange={e => setFeedback(e.target.value)} />
              </Field>
              <Button variant="destructive" onClick={handleReject} className="w-full" disabled={!feedback || rejectMutation.isPending}>
                Confirmar Recusa
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
