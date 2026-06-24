import { useEffect, useState, useMemo } from 'react'
import { Link } from '@tanstack/react-router'

import AppLayout from '@layout/app-layout'
import { FieldDescription } from '@ui/field'
import { Button } from '@ui/button'
import { apiFetch } from '@/lib/api'

type AvailableTrip = {
  id: string
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
  user_is_reserved?: boolean
}

const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const

function getWeekday(dateStr: string) {
  const [day, month, year] = dateStr.split('/')
  return new Date(Number(year), Number(month) - 1, Number(day)).getDay()
}

export function TripsHomePage() {
  const [trips, setTrips] = useState<AvailableTrip[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savingTripId, setSavingTripId] = useState<number | null>(null)
  const [reservedTripIds, setReservedTripIds] = useState<number[]>([])
  const [selectedDays, setSelectedDays] = useState<number[]>([])

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

  const availableWeekdays = useMemo(() => {
    const days = new Set(trips.map((t) => getWeekday(t.trip_date)))
    return Array.from(days).sort()
  }, [trips])

  const filteredTrips = useMemo(() => {
    if (selectedDays.length === 0) return trips
    return trips.filter((t) => selectedDays.includes(getWeekday(t.trip_date)))
  }, [trips, selectedDays])

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const handleReserve = async (tripId: number) => {
    setSavingTripId(tripId)
    setError(null)

    try {
      await apiFetch('/reservations/', {
        method: 'POST',
        body: JSON.stringify({ trip: tripId }),
      })
      setReservedTripIds((prev) => [...prev, tripId])

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
      <section className="mt-6 md:mt-8 mx-auto w-full max-w-5xl px-4">
        <header className="mb-5 md:mb-8 space-y-1.5 md:space-y-2">
          <p className="text-[10px] md:text-xs font-semibold tracking-[0.2em] text-primary uppercase">
            Viagens disponíveis
          </p>
          <h1 className="font-heading text-xl sm:text-2xl md:text-4xl font-semibold tracking-tight">
            Selecione sua viagem
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Viagens disponíveis para reserva no momento.
          </p>
        </header>

        {error ? (
          <FieldDescription className="mb-4 md:mb-6 rounded-md bg-red-50 p-3 md:p-4 text-xs md:text-sm text-red-700">
            {error}
          </FieldDescription>
        ) : null}

        {isLoading ? (
          <div className="rounded-4xl border border-dashed border-border bg-muted/30 p-4 md:p-8 text-center text-xs md:text-sm text-muted-foreground">
            Carregando viagens disponíveis...
          </div>
        ) : trips.length === 0 ? (
          <div className="rounded-4xl border border-dashed border-border bg-muted/30 p-4 md:p-8 text-center text-xs md:text-sm text-muted-foreground">
            Nenhuma viagem cadastrada para os próximos horários.
          </div>
        ) : (
          <div className="space-y-4">
            {trips.map((trip) => {
              const isAlreadyReserved = trip.user_is_reserved || reservedTripIds.includes(trip.id)

            <div className="rounded-3xl border border-border/70 bg-muted/20 p-2 md:p-3 flex flex-wrap gap-1.5 md:gap-2">
              <span className="inline-flex items-center text-[10px] md:text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase mr-1 md:mr-2">
                Dia
              </span>
              {availableWeekdays.map((day) => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`rounded-full px-3 md:px-4 py-1.5 md:py-2 text-[11px] md:text-sm font-semibold tracking-wide transition-colors ${
                    selectedDays.includes(day)
                      ? 'bg-primary text-primary-foreground'
                      : selectedDays.length === 0
                        ? 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                        : 'bg-muted/50 text-muted-foreground/60'
                  }`}
                >
                  {WEEKDAY_SHORT[day]}
                </button>
              ))}
              {selectedDays.length > 0 && (
                <button
                  onClick={() => setSelectedDays([])}
                  className="rounded-full px-3 md:px-4 py-1.5 md:py-2 text-[11px] md:text-sm font-semibold tracking-wide text-muted-foreground hover:text-foreground transition-colors"
                >
                  Limpar
                </button>
              )}
            </div>

            {filteredTrips.length === 0 ? (
              <div className="rounded-4xl border border-dashed border-border bg-muted/30 p-4 md:p-8 text-center text-xs md:text-sm text-muted-foreground">
                Nenhuma viagem encontrada para este dia.
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {filteredTrips.map((trip) => {
                  const isAlreadyReserved = reservedTripIds.includes(trip.id)

                  return (
                    <Link
                      key={trip.id}
                      to="/app/viagens/$id"
                      params={{ id: trip.id }}
                      className="block rounded-4xl border border-border/70 bg-card/90 px-3 md:px-4 py-3 md:py-5 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="flex flex-col gap-3 md:gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <h2 className="font-heading text-base md:text-2xl font-medium tracking-tight">
                            {trip.origin} &#8594; {trip.destiny}
                          </h2>
                          <p className="mt-0.5 md:mt-1 text-xs md:text-sm text-muted-foreground">
                            Status da viagem: {trip.status_trip}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 md:gap-3 self-end sm:self-auto">
                          <span className="rounded-full bg-primary/12 px-2 md:px-3 py-0.5 md:py-1 text-[10px] md:text-xs font-semibold tracking-wide uppercase text-primary">
                            {trip.available_seats} vagas
                          </span>

                          <Button
                            variant={isAlreadyReserved ? "outline" : "default"}
                            size="sm"
                            disabled={!trip.is_reservable || savingTripId === trip.id || isAlreadyReserved}
                            onClick={(e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); handleReserve(trip.id) }}
                          >
                            {!trip.is_reservable
                              ? 'Indisponível'
                              : savingTripId === trip.id
                                ? 'Reservando...'
                                : isAlreadyReserved
                                  ? 'Reservado'
                                  : 'Reservar'}
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 md:gap-3">
                        <div className="rounded-3xl bg-muted/30 p-2 md:p-3">
                          <p className="text-[9px] md:text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">Data</p>
                          <p className="mt-0.5 md:mt-1.5 text-xs md:text-base font-semibold">{trip.trip_date}</p>
                        </div>
                        <div className="rounded-3xl bg-muted/30 p-2 md:p-3">
                          <p className="text-[9px] md:text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">Partida</p>
                          <p className="mt-0.5 md:mt-1.5 text-xs md:text-base font-semibold">{trip.departure_time}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 md:gap-2 text-[10px] md:text-xs text-muted-foreground">
                        <span className="rounded-full bg-muted px-2 md:px-3 py-0.5 md:py-1">
                          Quórum: {trip.quorum_met ? 'atingido' : 'pendente'}
                        </span>
                        {trip.reservation_deadline ? (
                          <span className="rounded-full bg-muted px-2 md:px-3 py-0.5 md:py-1">
                            Limite: {new Date(trip.reservation_deadline).toLocaleString('pt-BR')}
                          </span>
                        ) : null}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}

                      <Button
                        variant="default"
                        size="sm"
                        disabled={!trip.is_reservable || savingTripId === trip.id || isAlreadyReserved}
                        onClick={() => handleReserve(trip.id)}
                        className={
                          isAlreadyReserved 
                            ? "bg-teal-600 text-white disabled:opacity-100 disabled:bg-teal-600" 
                            : ""
                        }
                      >
                        {isAlreadyReserved
                          ? 'Reservado'
                          : !trip.is_reservable
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

        <p className="mt-6 md:mt-8 text-center text-xs md:text-sm text-muted-foreground">
          As viagens exibidas respeitam o prazo de reserva e a disponibilidade de vagas no ônibus.
        </p>
      </section>
    </AppLayout>
  )
}
