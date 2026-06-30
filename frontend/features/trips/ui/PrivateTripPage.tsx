import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import AppLayout from '@layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/lib/ui/card'
import { Button } from '@/lib/ui/button'
import { Input } from '@/lib/ui/input'
import { MapTrifold } from '@phosphor-icons/react'

type AvailableTrip = {
  id: number
  trip_date: string
  origin: string
  destiny: string
  departure_time: string
  bus_brand: string
  status_trip: string
  available_seats: number
  is_reservable: boolean
  is_full: boolean
  quorum_met?: boolean
  reservation_deadline?: string
  user_is_reserved?: boolean
}

type ReservationError = {
  data?: {
    access_code?: string | string[]
    non_field_errors?: string | string[]
    detail?: string
  }
}

function getReservationErrorMessage(error: unknown) {
  const data = (error as ReservationError)?.data
  const message = data?.access_code || data?.non_field_errors || data?.detail

  return Array.isArray(message) ? message[0] : message || 'Erro ao reservar.'
}

function usePrivateTrip(code: string) {
  return useQuery({
    queryKey: ['private-trip', code],
    queryFn: () => apiFetch<AvailableTrip>(`/trips/private/?code=${code}`),
    enabled: !!code,
    retry: false,
  })
}

export function PrivateTripPage({ code: initialCode }: { code?: string }) {
  const [code, setCode] = useState(initialCode || '')
  const [submittedCode, setSubmittedCode] = useState(initialCode || '')
  const { data: trip, isLoading, error } = usePrivateTrip(submittedCode)

  const reserveMutation = useMutation({
    mutationFn: async ({ tripId, access_code }: { tripId: number, access_code: string }) => {
      return await apiFetch('/reservations/', {
        method: 'POST',
        body: JSON.stringify({ trip: tripId, access_code }),
      })
    }
  })

  const handleReserve = async () => {
    if (!trip) return
    try {
      await reserveMutation.mutateAsync({ tripId: trip.id, access_code: submittedCode })
      alert('Reserva realizada com sucesso!')
      window.location.href = '/app'
    } catch (error: unknown) {
      alert(getReservationErrorMessage(error))
    }
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto p-6 mt-8 space-y-6">
        <h1 className="text-2xl font-bold font-heading">Viagem Privada / De Campo</h1>
        
        {!initialCode && !trip && (
          <Card>
            <CardHeader>
              <CardTitle>Acessar Viagem</CardTitle>
              <CardDescription>Insira o código de acesso fornecido pelo professor/servidor responsável.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Input 
                value={code} 
                onChange={(e) => setCode(e.target.value)} 
                placeholder="Ex: CMP-8F2A" 
              />
              <Button onClick={() => setSubmittedCode(code)} disabled={!code}>Buscar</Button>
            </CardContent>
          </Card>
        )}

        {isLoading && <p>Buscando viagem...</p>}
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded">
            Viagem não encontrada ou código inválido.
          </div>
        )}

        {trip && (
          <Card className="border-primary/20 shadow-md">
            <CardHeader className="bg-primary/5 pb-4">
              <div className="flex items-center gap-3 text-primary">
                <MapTrifold weight="duotone" className="w-8 h-8" />
                <div>
                  <CardTitle className="text-xl">Viagem Exclusiva</CardTitle>
                  <CardDescription className="text-foreground/70">{trip.origin} → {trip.destiny}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Data</p>
                  <p className="font-medium">{trip.trip_date}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Horário de Saída</p>
                  <p className="font-medium">{trip.departure_time}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Vagas Disponíveis</p>
                  <p className="font-medium">{trip.available_seats}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium">{trip.status_trip}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                {trip.user_is_reserved ? (
                  <Button disabled className="w-full" variant="secondary">Você já está reservado nesta viagem.</Button>
                ) : trip.is_full ? (
                  <Button disabled className="w-full" variant="secondary">Viagem Lotada</Button>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={handleReserve}
                    disabled={reserveMutation.isPending}
                  >
                    {reserveMutation.isPending ? 'Reservando...' : 'Confirmar Reserva'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
