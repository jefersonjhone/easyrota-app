import { ArrowRightIcon } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import MotoraLayout from '@layout/Motora-layout'

import { apiFetch } from '@/lib/api'
import { normalizeTripTime } from '@/features/trips/utils/time'

type TripModelStatus =
  | 'RISCO DE CANCELAMENTO'
  | 'CONFIRMADA'
  | 'CANCELADA'
  | 'EM ANDAMENTO'
  | 'CONCLUIDA'
  | 'CONCLUÍDA'
  | string

type TripModel = {
  id: string
  trip_date: string
  status: TripModelStatus
  origin?: string
  destiny?: string
  departure_time?: string | null
  departure_timestamp?: string | null
  available_seats?: number
  seating_capacity?:	number
  reserved_seats?:	number
  is_full?: boolean
}

type DriverTrip = {
  id: string
  tripDate: string
  tripDateLabel: string
  origin: string
  destiny: string
  departureTime: string
  status: TripModelStatus
  statusLabel: string
  availableSeats: number | null
}

const statusLabels: Record<string, string> = {
  'RISCO DE CANCELAMENTO': 'Risco de cancelamento',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
  'EM ANDAMENTO': 'Em andamento',
  CONCLUIDA: 'Concluída',
  CONCLUÍDA: 'Concluída',
}

function normalizeDateToIso(date: string) {
  if (/^\d{4}-\d{2}-\d{2}/.test(date)) {
    return date.slice(0, 10)
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
    const [day, month, year] = date.split('/')
    return `${year}-${month}-${day}`
  }

  return date
}

function formatDateLabel(date: string) {
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
    return date
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(date)) {
    const [year, month, day] = date.slice(0, 10).split('-')
    return `${day}/${month}/${year}`
  }

  return date
}

function toStatusLabel(status: TripModelStatus) {
  const statusText = String(status)
  return statusLabels[statusText] ?? statusText.toLowerCase()
}

function normalizeTripFromModel(
  trip: TripModel,
): DriverTrip {
  const origin = trip.origin
  const destiny = trip.destiny
  const departureTime = normalizeTripTime(trip.departure_time ?? trip.departure_timestamp)

  const availableSeats =
    (typeof trip.seating_capacity === 'number' && typeof trip.reserved_seats === 'number') ? trip.seating_capacity - trip.reserved_seats : null
  return {
    id: trip.id,
    tripDate: normalizeDateToIso(trip.trip_date),
    tripDateLabel: formatDateLabel(trip.trip_date),
    origin: origin ? origin : 'Origem com erro',
    destiny: destiny ? destiny : 'Destino com erro',
    departureTime,
    status: trip.status,
    statusLabel: toStatusLabel(trip.status),
    availableSeats,
  }
}

async function getTripsFromApi() {
  try {
    const response = await apiFetch(`/trips/`)
    const data = response as TripModel[]
    return data
      .map((trip) => normalizeTripFromModel(trip))
      .sort((first, second) => first.departureTime.localeCompare(second.departureTime))
  } catch (error) {
    throw new Error(`Falha ao carregar ${error}`)
  }
}

function getStatusCard(trip: DriverTrip) {
  if (trip.status === 'CANCELADA') {
    return {
      modifier: 'canceled',
      label: 'Cancelada',
      description: 'Viagem indisponível',
    }
  }

  if (trip.status === 'EM ANDAMENTO') {
    return {
      modifier: 'in-progress',
      label: 'Em andamento',
      description: 'retomar viagem',
    }
  }

  if (trip.availableSeats !== null) {
    const seatLabel = trip.availableSeats === 1 ? '1 vaga' : `${trip.availableSeats.toString()} vagas`

    return {
      modifier: 'available',
      label: seatLabel,
      description: 'disponíveis',
    }
  }

  return {
    modifier: 'available',
    label: 'Vagas',
    description: 'disponíveis',
  }
}

function getSideClasses(modifier: string) {
  // returns tailwind classes (only utilities) — using CSS variables inside arbitrary values
  switch (modifier) {
    case 'canceled':
      return {
        container: 'border-[var(--destructive)] bg-[var(--destructive)]/10 text-[var(--destructive)]',
        description: 'text-[var(--destructive)]/70',
      }
    case 'in-progress':
      return {
        container: 'border-primary bg-muted-foreground/10 text-muted-foreground',
        description: 'text-[var(--primary)]/70',
      }
    case 'available':
      return {
        container: 'border-primary bg-primary/15 text-primary',
        description: 'text-[var(--primary)]/70',
      }
    case 'full':
      return {
        container: 'border-[var(--muted-foreground)] bg-[var(--muted)]/70 text-[var(--muted-foreground)]',
        description: 'text-[var(--muted-foreground)]/70',
      }
    default:
      return {
        container: 'border-[var(--border)] bg-transparent text-[var(--foreground)]',
        description: 'text-[var(--muted-foreground)]',
      }
  }
}

function getActionClasses(isCanceled: boolean) {
  if (isCanceled) {
    return 'border-[var(--border)] bg-[var(--muted)]/80 text-[var(--muted-foreground)] cursor-not-allowed'
  }


  return ' hover:translate-y-0 hover:-translate-y-px transition-transform'
}

export function MotoristaTripsPage() {
  const [trips, setTrips] = useState<DriverTrip[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadTrips = async () => {
      setError(null)
      setIsLoading(true)

      try {
        const data: DriverTrip[] = await getTripsFromApi()

        if (isMounted) {
          setTrips(data)
        }
      } catch (loadError) {
        console.error('Erro ao carregar viagens do motorista:', loadError)

        if (isMounted) {
          setError('Não foi possível carregar as viagens do dia.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadTrips()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <MotoraLayout user={{ name: 'Motorista', kind: 'driver' }}>
      <section aria-labelledby="driver-trips-title" className="mx-auto w-full max-w-5xl px-4">
        <header className="mb-7">
          <p className="mb-2.5 text-primary text-xs font-bold tracking-[0.2em] leading-[1.2] uppercase ">
            Viagens de hoje
          </p>

          <h1 id="driver-trips-title" className="m-0 text-foreground text-[2.5rem] font-heading leading-[1.12]">
            Viagens do Motorista
          </h1>

          <p className="max-w-[44rem] mt-3 text-muted-foreground text-[0.95rem] leading-[1.55]">
            Viagens cadastradas para hoje, ordenadas pelo horário de partida.
          </p>
        </header>

        {error ? (
          <p className="border-dashed border-[var(--destructive)]/40 bg-[var(--destructive)]/10 rounded-md p-5 text-center text-destructive mb-4">
            {error}
          </p>
        ) : null}

        {isLoading ? (
          <div className="border-dashed border-[var(--border)] bg-[var(--muted)]/60 rounded-md p-5 text-center text-muted-foreground">
            Carregando viagens do dia...
          </div>
        ) : trips.length === 0 ? (
          <div className="border-dashed border-[var(--border)] bg-[var(--muted)]/60 rounded-md p-5 text-center text-muted-foreground">
            Nenhuma viagem cadastrada para hoje.
          </div>
        ) : (
          <div className="grid gap-3.5">
            {trips.map((trip) => {
              const statusCard = getStatusCard(trip)
              const isCanceled = trip.status === 'CANCELADA'
              const isInProgress = trip.status === 'EM ANDAMENTO'

              const side = getSideClasses(statusCard.modifier)
              const actionClass = getActionClasses(isCanceled)

              const cardContent = (
                <>
                  <div className="min-w-0 py-1 px-1">
                    <h2
                      className="flex flex-wrap gap-1 items-baseline m-0 text-foreground text-[1.45rem] font-heading leading-[1.2] font-medium"
                      aria-label={`${trip.origin} para ${trip.destiny}`}
                    >
                      <span className="min-w-0 wrap-break-words">{trip.origin}</span>
                      <span aria-hidden="true">&#8594;</span>
                      <span className="min-w-0 wrap-break-words">{trip.destiny}</span>
                    </h2>

                    <div className="flex flex-wrap gap-1 mt-2 text-muted-foreground text-[0.86rem] leading-[1.4]">
                      <span>{trip.tripDateLabel}</span>
                      <span aria-hidden="true">&#8226;</span>
                      <span>{trip.departureTime}</span>
                    </div>

                    <p className="mt-1 text-muted-foreground  text-[0.86rem] leading-[1.4]">
                      Status da viagem: {trip.statusLabel}
                    </p>
                  </div>

                  <div
                    className={`min-w-0 rounded-lg p-3 flex flex-row md:flex-col items-center justify-around h-15 ${side.container}`}
                    aria-label={`Status: ${statusCard.label} ${statusCard.description}`}
                  >
                    <span className="block text-[0.85rem] font-extrabold leading-[1.1] uppercase wrap-break-words">
                      {statusCard.label}
                    </span>
                    <span className={`block mt-1 text-[0.76rem] font-semibold leading-tight `}>
                      {statusCard.description}
                    </span>
                  </div>

                  <div className="h-10">
                    <span className={`min-w-0  p-2 rounded-md flex md:flex-col items-center justify-around 
                      ${actionClass} ${isCanceled ? 'opacity-70' : 'hover:-translate-y-px transition-transform'}
                      ${isInProgress?'bg-green-700 text-white':"border-primary bg-primary text-primary-foreground"}
                      `}>
                      <span className="block text-[0.9rem] font-extrabold leading-[1.1] ">
                        {isCanceled ? 'Indisponível' : isInProgress ? 'Retomar' : 'Selecionar'}
                      </span>
                      <span className="inline-flex items-center truncate text-sm">
                        {isCanceled ? 'Viagem cancelada' : isInProgress ? 'Voltar para viagem' : 'Abrir viagem'}
                        {isCanceled ? null : <ArrowRightIcon aria-hidden="true" weight="bold" size={16} />}
                      </span>
                    </span>
                  </div>
                </>
              )

              const baseCardClass =
                'grid items-stretch gap-3 border rounded-[8px] bg-[var(--card)] shadow-md p-3 transition duration-150 ease-in-out'

              return isCanceled ? (
                <article key={trip.id} className={`${baseCardClass} grid-cols-1 md:grid-cols-[1fr_10rem_10rem]`}>
                  {cardContent}
                </article>
              ) : (
                <Link
                  key={trip.id}
                  className={`${baseCardClass} grid-cols-1 md:grid-cols-[1fr_10rem_10rem] no-underline text-current hover:-translate-y-px hover:shadow-xl`}
                  to="/app/motorista/viagem/$tripId"
                  params={{ tripId: trip.id }}
                  aria-label={`Abrir detalhes da viagem ${trip.origin} para ${trip.destiny}`}
                >
                  {cardContent}
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </MotoraLayout>
  )
}
