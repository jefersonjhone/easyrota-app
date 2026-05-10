import { useEffect, useState } from 'react'

import AppLayout from '@layout/app-layout'
import { FieldDescription } from '@ui/field'
import { Button } from '@ui/button'

type TripStatus = 'CONFIRMADA' | 'CANCELADA'

type TripOption = {
  id: number
  trip_date: string
  origin: string
  destiny: string
  departure_time: string
  bus_type: string
  status: TripStatus
  status_trip: string
  available_seats: number
  is_full: boolean
}

type MockTripSeed = {
  id: number
  origin: string
  destiny: string
  departure_offset_minutes: number
  bus_type: string
  seating_capacity: number
  active_reservations: number
  checkins_last_two_minutes: number
}

const mockTripsSeed: MockTripSeed[] = [
  {
    id: 1,
    origin: 'FSA',
    destiny: 'SSA',
    departure_offset_minutes: 90,
    bus_type: 'Executivo',
    seating_capacity: 44,
    active_reservations: 32,
    checkins_last_two_minutes: 0,
  },
  {
    id: 2,
    origin: 'SSA',
    destiny: 'FSA',
    departure_offset_minutes: 1,
    bus_type: 'Convencional',
    seating_capacity: 40,
    active_reservations: 36,
    checkins_last_two_minutes: 0,
  },
  {
    id: 3,
    origin: 'FSA',
    destiny: 'SSA',
    departure_offset_minutes: 240,
    bus_type: 'Executivo',
    seating_capacity: 46,
    active_reservations: 46,
    checkins_last_two_minutes: 3,
  },
  {
    id: 4,
    origin: 'SSA',
    destiny: 'FSA',
    departure_offset_minutes: 420,
    bus_type: 'Noturno',
    seating_capacity: 44,
    active_reservations: 18,
    checkins_last_two_minutes: 0,
  },
]

const formatterDate = new Intl.DateTimeFormat('pt-BR')
const formatterTime = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

function toTripStatusLabel(status: TripStatus) {
  if (status === 'CANCELADA') return 'Cancelada por ausência de check-in'
  return 'Confirmada'
}

function toTripOption(seed: MockTripSeed, now: Date): TripOption {
  const departureDate = new Date(now.getTime() + seed.departure_offset_minutes * 60_000)
  const inLastTwoMinutesWindow = seed.departure_offset_minutes <= 2
  const shouldCancel = inLastTwoMinutesWindow && seed.checkins_last_two_minutes === 0
  const status: TripStatus = shouldCancel ? 'CANCELADA' : 'CONFIRMADA'
  const availableSeats = Math.max(seed.seating_capacity - seed.active_reservations, 0)

  return {
    id: seed.id,
    trip_date: formatterDate.format(departureDate),
    origin: seed.origin,
    destiny: seed.destiny,
    departure_time: formatterTime.format(departureDate),
    bus_type: seed.bus_type,
    status,
    status_trip: toTripStatusLabel(status),
    available_seats: availableSeats,
    is_full: availableSeats === 0,
  }
}

async function getMockTrips(): Promise<TripOption[]> {
  await new Promise((resolve) => {
    setTimeout(resolve, 450)
  })

  const now = new Date()
  return mockTripsSeed
    .slice()
    .sort((first, second) => first.departure_offset_minutes - second.departure_offset_minutes)
    .map((seed) => toTripOption(seed, now))
}

export function TripsHomePage() {
  const [trips, setTrips] = useState<TripOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadTrips = async () => {
      setError(null)
      setIsLoading(true)

      try {
        const data = await getMockTrips()
        setTrips(data)
      } catch (err) {
        console.error('Erro ao carregar viagens disponíveis:', err)
        setError('Não foi possível carregar as viagens no momento.')
      } finally {
        setIsLoading(false)
      }
    }

    loadTrips()
  }, [])

  return (
    <AppLayout>
      <section className="mx-auto w-full max-w-5xl px-4">
        <header className="mb-8 space-y-2">
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
            Disponíveis hoje
          </p>
          <h1 className="font-heading text-4xl font-semibold tracking-tight">
            Selecione sua Viagem
          </h1>
          <p className="text-muted-foreground">
            Mock dinâmico temporário para validar a experiência da tela de viagens.
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
              const isCanceled = trip.status === 'CANCELADA'

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
                        {trip.trip_date} &#8226; {trip.departure_time} &#8226; {trip.bus_type}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Status da viagem: {trip.status_trip}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <span
                        className={[
                          'rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase',
                          isCanceled
                            ? 'bg-destructive/10 text-destructive'
                            : trip.is_full
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-primary/12 text-primary',
                        ].join(' ')}
                      >
                        {isCanceled
                          ? 'Cancelada'
                          : trip.is_full
                            ? 'Lotado'
                            : `${trip.available_seats} vagas`}
                      </span>

                      <Button
                        variant={isCanceled || trip.is_full ? 'outline' : 'default'}
                        size="sm"
                        disabled={isCanceled}
                      >
                        {isCanceled ? 'Indisponível' : trip.is_full ? 'Ver Lista' : 'Detalhes'}
                      </Button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Regra aplicada no mock: sem check-in nos 2 minutos finais antes da partida, a
          viagem é cancelada.
        </p>
      </section>
    </AppLayout>
  )
}
