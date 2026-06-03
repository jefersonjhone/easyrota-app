import { useEffect, useState } from 'react'
import { Button } from '@ui/button'
import { Card, CardContent } from '@ui/card'
import { apiFetch } from '@/lib/api'
import { formatTripDate } from "@/features/user-home/config";

interface TripReservation {
  id: number
  origin: string
  destiny: string
  trip_date: string
  trip_history_status: 'PENDENTE' | 'CONCLUÍDA' | 'CANCELADA' | 'FALTA'
  reservation_status: 'PENDENTE' | 'CONFIRMADA' | 'LISTA SECUNDÁRIA'
  can_cancel: boolean
  quorum_met: boolean
  created_at: string
}

export function TripsHistoryPage() {
  const [trips, setTrips] = useState<TripReservation[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelingId, setCancelingId] = useState<number | null>(null)

  useEffect(() => {
    apiFetch<TripReservation[]>('/reservations/history/')
      .then((data) => {
        setTrips(data)
      })
      .catch((err) => console.error('Erro ao buscar histórico:', err))
      .finally(() => setLoading(false))
  }, [])

  const handleCancel = async (reservationId: number) => {
    setCancelingId(reservationId)
    try {
      await apiFetch(`/reservations/manage/${reservationId}/cancel/`, {
        method: 'POST',
      })
      const data = await apiFetch<TripReservation[]>('/reservations/history/')
      setTrips(data)
    } catch (err) {
      console.error('Erro ao cancelar reserva:', err)
    } finally {
      setCancelingId(null)
    }
  }

  const getStatusStyles = (status: TripReservation['trip_history_status']) => {
    switch (status) {
      case 'CONCLUÍDA':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
      case 'PENDENTE':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
      case 'CANCELADA':
        return 'bg-muted text-muted-foreground border-border'
      case 'FALTA':
        return 'bg-destructive/10 text-destructive border-destructive/20'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  const getStatusLabel = (status: TripReservation['trip_history_status']) => {
    switch (status) {
      case 'CONCLUÍDA': return 'Concluída'
      case 'PENDENTE': return 'Em Espera / Pendente'
      case 'CANCELADA': return 'Cancelada'
      case 'FALTA': return 'Falta Computada'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="w-full text-center p-8 text-muted-foreground animate-pulse font-medium">
        Carregando histórico...
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-6 text-left">
      <h1 className="text-2xl md:text-3xl font-heading font-bold mb-6 text-foreground">
        Histórico de Viagens
      </h1>

      <div className="flex flex-col gap-4">
        {trips.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground border border-dashed border-border rounded-xl">
            Nenhuma viagem encontrada no seu histórico.
          </div>
        ) : (
          trips.map((trip) => (
            <Card key={trip.id} className="w-full bg-card border-border">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Data e Rota
                    </span>
                    <div className="flex items-center gap-2 text-sm md:text-base font-medium text-foreground">
                      <span>{formatTripDate(trip.trip_date)}</span>
                      <span className="text-muted-foreground">•</span>
                      <span>{trip.origin}</span>
                      <span className="text-muted-foreground">↔</span>
                      <span>{trip.destiny}</span>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${getStatusStyles(trip.trip_history_status)}`}>
                      {getStatusLabel(trip.trip_history_status)}
                    </span>
                    <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full bg-muted px-3 py-1">
                        Reserva: {trip.reservation_status}
                      </span>
                      <span className="rounded-full bg-muted px-3 py-1">
                        Quórum: {trip.quorum_met ? 'atingido' : 'pendente'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2 md:pt-0 border-t border-border md:border-none">
                    <Button variant="outline" size="sm" className="font-bold text-xs h-9 px-4 hidden">
                      Detalhes
                    </Button>
                    {trip.can_cancel && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-bold text-xs h-9 px-4 text-destructive hover:bg-destructive/10 border-destructive/20"
                        onClick={() => handleCancel(trip.id)}
                        disabled={cancelingId === trip.id}
                      >
                        {cancelingId === trip.id ? 'Cancelando...' : 'Cancelar'}
                      </Button>
                    )}
                  </div>

                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
