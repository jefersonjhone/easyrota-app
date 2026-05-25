import { useEffect, useState } from 'react'

import AppLayout from '@layout/app-layout'
import { FieldDescription } from '@ui/field'
import { Button } from '@ui/button'
import { apiFetch } from '@/lib/api'

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
  quorum_met?: boolean
  reservation_deadline?: string
}

export function TripsHomePage() {
  const [trips, setTrips] = useState<AvailableTrip[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savingTripId, setSavingTripId] = useState<number | null>(null)

  useEffect(() => {
    const loadTrips = async () => {
      setError(null)
      setIsLoading(true)

      try {
        const data = await apiFetch<AvailableTrip[]>('/reservations/available-trips/')
        setTrips(data)
      } catch (err) {
        console.error('Erro ao carregar viagens disponíveis:', err)

        const errorData = err as { data?: { detail?: string } } | undefined
        const detail = errorData?.data?.detail
        const message = detail || 'Não foi possível carregar as viagens no momento.'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    loadTrips()
  }, [])

  const handleReserve = async (tripId: number) => {
    setSavingTripId(tripId)
    setError(null)

    try {
      await apiFetch('/reservations/', {
        method: 'POST',
        body: JSON.stringify({ trip: tripId }),
      })
      const data = await apiFetch<AvailableTrip[]>('/reservations/available-trips/')
      setTrips(data)
    } catch (err) {
      const errorData = err as { data?: { detail?: string } } | undefined
      setError(errorData?.data?.detail || 'Não foi possível reservar esta viagem.')
    } finally {
      setSavingTripId(null)
    }
  }

  return (
    <AppLayout>
      <section className="mx-auto w-full max-w-5xl px-4">
        <header className="mb-8 space-y-2">
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
            Viagens disponíveis
          </p>
          <h1 className="font-heading text-4xl font-semibold tracking-tight">
            Selecione sua viagem
          </h1>
          <p className="text-muted-foreground">
            Viagens liberadas pelo backend para reserva do usuário autenticado.
          </p>
        </header>

        {error ? (
          <FieldDescription className="mb-6 rounded-md bg-red-50 p-4 text-red-700">
            {error}
          </FieldDescription>
        ) : null}

        {isLoading ? (
          <div className="rounded-4xl border border-dashed border-border bg-muted/30 p-8 text-center text-muted-foreground">
            Carregando viagens disponíveis...
          </div>
        ) : trips.length === 0 ? (
          <div className="rounded-4xl border border-dashed border-border bg-muted/30 p-8 text-center text-muted-foreground">
            Nenhuma viagem cadastrada para os próximos horários.
          </div>
        ) : (
          <div className="space-y-4">
            {trips.map((trip) => {
              return (
                <article
                  key={trip.id}
                  className="rounded-4xl border border-border/70 bg-card/90 px-4 py-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="font-heading text-2xl font-medium tracking-tight">
                        {trip.origin} &#8594; {trip.destiny}
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {trip.trip_date} &#8226; {trip.departure_time} &#8226; {trip.bus_brand}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Status da viagem: {trip.status_trip}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <span className="rounded-full bg-primary/12 px-3 py-1 text-xs font-semibold tracking-wide uppercase text-primary">
                        {trip.available_seats} vagas
                      </span>

                      <Button
                        variant="default"
                        size="sm"
                        disabled={!trip.is_reservable || savingTripId === trip.id}
                        onClick={() => handleReserve(trip.id)}
                      >
                        {!trip.is_reservable
                          ? 'Indisponível'
                          : savingTripId === trip.id
                            ? 'Reservando...'
                            : 'Reservar'}
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-3 py-1">
                      Quórum: {trip.quorum_met ? 'atingido' : 'pendente'}
                    </span>
                    {trip.reservation_deadline ? (
                      <span className="rounded-full bg-muted px-3 py-1">
                        Limite: {new Date(trip.reservation_deadline).toLocaleString('pt-BR')}
                      </span>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </div>
        )}

        <p className="mt-8 text-center text-sm text-muted-foreground">
          As viagens exibidas respeitam o prazo de reserva e a lotação disponível no backend.
        </p>
      </section>
    </AppLayout>
  )
}
