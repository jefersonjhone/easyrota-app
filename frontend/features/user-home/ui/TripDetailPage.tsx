import { useEffect, useState } from 'react'
import { useParams, Link } from '@tanstack/react-router'
import { Button } from '@ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/card'
import { ArrowLeft, CalendarBlank, Clock, Bus, Users, CheckCircle } from '@phosphor-icons/react'
import { apiFetch } from '@/lib/api'
import { formatTripDate } from '../config'
import type { AvailableTrip } from '../types'

export function TripDetailPage() {
  const { id } = useParams({ from: '/app/viagens/$id' })
  const [trip, setTrip] = useState<AvailableTrip | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isReserving, setIsReserving] = useState(false)
  const [reserved, setReserved] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    apiFetch<AvailableTrip>(`/trips/${id}/`)
      .then(setTrip)
      .catch((err) => {
        const data = err as { data?: { detail?: string } }
        setError(data?.data?.detail || 'Não foi possível carregar os dados da viagem.')
      })
      .finally(() => setIsLoading(false))
  }, [id])

  const handleReserve = async () => {
    if (!trip) return
    setIsReserving(true)
    try {
      await apiFetch('/reservations/', {
        method: 'POST',
        body: JSON.stringify({ trip: trip.id }),
      })
      setReserved(true)
    } catch (err) {
      const data = err as { data?: { detail?: string } }
      setError(data?.data?.detail || 'Não foi possível reservar esta viagem.')
    } finally {
      setIsReserving(false)
    }
  }

  if (isLoading) {
    return (
      <section className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 mt-8">
        <div className="rounded-4xl border border-dashed border-border bg-muted/30 p-4 md:p-8 text-center text-xs md:text-sm text-muted-foreground">
          Carregando detalhes da viagem...
        </div>
      </section>
    )
  }

  if (error || !trip) {
    return (
      <section className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 mt-8">
        <div className="rounded-4xl border border-dashed border-border bg-muted/30 p-4 md:p-8 text-center">
          <div className="space-y-3 md:space-y-4">
            <div>
              <h3 className="text-sm md:text-lg font-semibold">Viagem não encontrada</h3>
              <p className="mt-1.5 md:mt-2 text-xs md:text-sm text-muted-foreground">
                {error || 'Esta viagem pode não estar mais disponível.'}
              </p>
            </div>
            <Link to="/app/viagens">
              <Button variant="outline" size="sm" className="md:default">
                <ArrowLeft size={14} className="md:size-[16px]" />
                Voltar
              </Button>
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 mt-6 md:mt-8">
      <div className="mb-4 md:mb-6">
        <Link
          to="/app/viagens"
          className="inline-flex items-center gap-1 text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} className="md:size-[16px]" />
          Voltar para viagens
        </Link>
      </div>

      <div className="mb-5 md:mb-8 space-y-1.5 md:space-y-2">
        <span className="inline-flex w-fit rounded-full bg-primary/10 px-2.5 py-0.5 md:px-3 md:py-1 text-[10px] md:text-xs font-semibold tracking-[0.2em] text-primary uppercase">
          Viagem disponível
        </span>
        <h1 className="font-heading text-lg sm:text-xl md:text-3xl lg:text-4xl font-semibold tracking-tight">
          {trip.origin} → {trip.destiny}
        </h1>
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/70 bg-card/95">
          <CardHeader className="border-b border-border/70 pb-3 md:pb-5">
            <CardTitle className="text-sm md:text-lg">Informações da viagem</CardTitle>
            <CardDescription className="text-xs md:text-sm">Dados operacionais do trajeto.</CardDescription>
          </CardHeader>
          <CardContent className="pt-3 md:pt-6">
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <div className="rounded-3xl bg-muted/30 p-2.5 md:p-4">
                <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                  <CalendarBlank size={12} className="md:size-[14px]" />
                  Data
                </div>
                <p className="mt-1 md:mt-2 text-xs md:text-base font-semibold">{formatTripDate(trip.trip_date)}</p>
              </div>
              <div className="rounded-3xl bg-muted/30 p-2.5 md:p-4">
                <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                  <Clock size={12} className="md:size-[14px]" />
                  Horário
                </div>
                <p className="mt-1 md:mt-2 text-xs md:text-base font-semibold">{trip.departure_time}</p>
              </div>
              <div className="rounded-3xl bg-muted/30 p-2.5 md:p-4">
                <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                  <Bus size={12} className="md:size-[14px]" />
                  Ônibus
                </div>
                <p className="mt-1 md:mt-2 text-xs md:text-base font-semibold truncate">{trip.bus_brand}</p>
              </div>
              <div className="rounded-3xl bg-muted/30 p-2.5 md:p-4">
                <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                  <Users size={12} className="md:size-[14px]" />
                  Vagas
                </div>
                <p className="mt-1 md:mt-2 text-xs md:text-base font-semibold">{trip.available_seats}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4 md:space-y-6">
          <Card className="border-border/70 bg-card/95">
            <CardHeader className="border-b border-border/70 pb-3 md:pb-5">
              <CardTitle className="text-sm md:text-lg">Reserva</CardTitle>
            </CardHeader>
            <CardContent className="pt-3 md:pt-6 space-y-3 md:space-y-4">
              <div className="rounded-3xl border border-border/70 p-3 md:p-4">
                <p className="text-xs md:text-sm text-muted-foreground">Status da viagem</p>
                <p className="mt-0.5 md:mt-2 text-sm md:text-lg font-semibold">{trip.status_trip}</p>
              </div>

              {trip.quorum_met !== undefined && (
                <div className="rounded-3xl border border-border/70 p-3 md:p-4">
                  <p className="text-xs md:text-sm text-muted-foreground">Quórum</p>
                  <p className="mt-0.5 md:mt-2 text-sm md:text-lg font-semibold">
                    {trip.quorum_met ? 'Atingido' : 'Pendente'}
                  </p>
                </div>
              )}

              {trip.reservation_deadline && (
                <div className="rounded-3xl border border-border/70 p-3 md:p-4">
                  <p className="text-xs md:text-sm text-muted-foreground">Limite para reserva</p>
                  <p className="mt-0.5 md:mt-2 text-sm md:text-lg font-semibold">
                    {new Date(trip.reservation_deadline).toLocaleString('pt-BR')}
                  </p>
                </div>
              )}

              <Button
                className="w-full"
                size="sm"
                disabled={!trip.is_reservable || isReserving || reserved}
                onClick={handleReserve}
              >
                {reserved ? (
                  <>
                    <CheckCircle size={14} className="md:size-[16px]" />
                    Reservado
                  </>
                ) : isReserving ? (
                  'Reservando...'
                ) : !trip.is_reservable ? (
                  'Indisponível'
                ) : (
                  'Reservar'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
