import { ArrowRightIcon } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import MotoraLayout from '@layout/Motora-layout'

import './DriverTripsPage.css'

type TripModelStatus =
  | 'RISCO DE CANCELAMENTO'
  | 'CONFIRMADA'
  | 'CANCELADA'
  | 'EM ANDAMENTO'
  | 'CONCLUIDA'
  | 'CONCLUÍDA'
  | string

type ApiList<T> = T[] | { results?: T[] }

type RouteModel = {
  id: number
  origin: string
  destiny: string
  departure_time: string
}

type TripModel = {
  id: number
  trip_date: string
  status: TripModelStatus
  route?: number | RouteModel | null
  origin?: string
  destiny?: string
  departure_time?: string
  available_seats?: number
  is_full?: boolean
}

type DriverTrip = {
  id: number
  tripDate: string
  tripDateLabel: string
  origin: string
  destiny: string
  departureTime: string
  status: TripModelStatus
  statusLabel: string
  availableSeats: number | null
}

type MockDriverTripSeed = {
  id: number
  origin: string
  destiny: string
  departure_time: string
  status: TripModelStatus
  seating_capacity: number
  active_reservations: number
}

const statusLabels: Record<string, string> = {
  'RISCO DE CANCELAMENTO': 'Risco de cancelamento',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
  'EM ANDAMENTO': 'Em andamento',
  CONCLUIDA: 'Concluída',
  CONCLUÍDA: 'Concluída',
}

const todayFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const mockTripsSeed: MockDriverTripSeed[] = [
  {
    id: 1,
    origin: 'SALVADOR',
    destiny: 'FEIRA',
    departure_time: '07:20',
    status: 'CANCELADA',
    seating_capacity: 40,
    active_reservations: 36,
  },
  {
    id: 2,
    origin: 'FEIRA',
    destiny: 'SALVADOR',
    departure_time: '10:30',
    status: 'CONFIRMADA',
    seating_capacity: 44,
    active_reservations: 32,
  },
  {
    id: 3,
    origin: 'FEIRA',
    destiny: 'SALVADOR',
    departure_time: '14:10',
    status: 'CONFIRMADA',
    seating_capacity: 46,
    active_reservations: 46,
  },
  {
    id: 4,
    origin: 'SALVADOR',
    destiny: 'FEIRA',
    departure_time: '18:40',
    status: 'EM ANDAMENTO',
    seating_capacity: 44,
    active_reservations: 18,
  },
]

function toList<T>(payload: ApiList<T>): T[] {
  return Array.isArray(payload) ? payload : payload.results ?? []
}

function getTodayIsoDate() {
  const parts = todayFormatter.formatToParts(new Date())
  const day = parts.find((part) => part.type === 'day')?.value ?? '01'
  const month = parts.find((part) => part.type === 'month')?.value ?? '01'
  const year = parts.find((part) => part.type === 'year')?.value ?? '2026'

  return `${year}-${month}-${day}`
}

function getTodayLabel() {
  return todayFormatter.format(new Date())
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

function normalizeTime(time?: string) {
  return time ? time.slice(0, 5) : '00:00'
}

function toStatusLabel(status: TripModelStatus) {
  const statusText = String(status)
  return statusLabels[statusText] ?? statusText.toLowerCase()
}

function toMockDriverTrip(seed: MockDriverTripSeed): DriverTrip {
  const availableSeats =  seed.active_reservations
  const tripDate = getTodayIsoDate()

  return {
    id: seed.id,
    tripDate,
    tripDateLabel: getTodayLabel(),
    origin: seed.origin,
    destiny: seed.destiny,
    departureTime: seed.departure_time,
    status: seed.status,
    statusLabel: toStatusLabel(seed.status),
    availableSeats,
  }
}

function normalizeTripFromModel(
  trip: TripModel,
  routesById: Map<number, RouteModel>,
): DriverTrip | null {
  const route = typeof trip.route === 'object' ? trip.route : routesById.get(Number(trip.route))
  const origin = trip.origin ?? route?.origin
  const destiny = trip.destiny ?? route?.destiny
  const departureTime = normalizeTime(trip.departure_time ?? route?.departure_time)

  if (!origin || !destiny || !trip.trip_date) {
    return null
  }

  const availableSeats =
    typeof trip.available_seats === 'number' ? Math.max(trip.available_seats, 0) : null
  return {
    id: trip.id,
    tripDate: normalizeDateToIso(trip.trip_date),
    tripDateLabel: formatDateLabel(trip.trip_date),
    origin,
    destiny,
    departureTime,
    status: trip.status,
    statusLabel: toStatusLabel(trip.status),
    availableSeats,
  }
}

async function getTripsFromApi() {
  const requestJson = async <T,>(path: string): Promise<T> => {
    const response = await fetch(`/api${path}`)

    if (!response.ok) {
      throw new Error(`Falha ao carregar ${path}`)
    }

    return response.json() as Promise<T>
  }

  const [tripsPayload, routesPayload] = await Promise.all([
    requestJson<ApiList<TripModel>>('/trips/'),
    requestJson<ApiList<RouteModel>>('/routes/'),
  ])

  const routesById = new Map(toList(routesPayload).map((route) => [route.id, route]))
  const today = getTodayIsoDate()

  return toList(tripsPayload)
    .map((trip) => normalizeTripFromModel(trip, routesById))
    .filter((trip): trip is DriverTrip => Boolean(trip))
    .filter((trip) => trip.tripDate === today)
    .sort((first, second) => first.departureTime.localeCompare(second.departureTime))
}

async function getFallbackTrips() {
  await new Promise((resolve) => {
    setTimeout(resolve, 350)
  })

  return mockTripsSeed
    .map(toMockDriverTrip)
    .sort((first, second) => first.departureTime.localeCompare(second.departureTime))
}

async function getDriverTrips() {
  try {
    return await getTripsFromApi()
  } catch (error) {
    console.warn('Usando viagens temporárias para a tela do motorista:', error)
    return getFallbackTrips()
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


  if (trip.availableSeats !== null) {
    const seatLabel = trip.availableSeats === 1 ? '1 vaga' : `${trip.availableSeats} vagas`

    return {
      modifier: 'available',
      label: seatLabel,
      description: 'reservadas',
    }
  }

  return {
    modifier: 'available',
    label: 'Vagas',
    description: 'disponíveis',
  }
}

export function DriverTripsPage() {
  const [trips, setTrips] = useState<DriverTrip[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadTrips = async () => {
      setError(null)
      setIsLoading(true)

      try {
        const data = await getDriverTrips()

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
      <section className="driver-trips" aria-labelledby="driver-trips-title">
        <header className="driver-trips__header">
          <p className="driver-trips__eyebrow">Viagens de hoje</p>
          <h1 id="driver-trips-title" className="driver-trips__title">
            Viagens do Motorista
          </h1>
          <p className="driver-trips__subtitle">
            Viagens cadastradas para hoje, ordenadas pelo horário de partida.
          </p>
        </header>

        {error ? <p className="driver-trips__notice driver-trips__notice--error">{error}</p> : null}

        {isLoading ? (
          <div className="driver-trips__notice">Carregando viagens do dia...</div>
        ) : trips.length === 0 ? (
          <div className="driver-trips__notice">Nenhuma viagem cadastrada para hoje.</div>
        ) : (
          <div className="driver-trips__list">
            {trips.map((trip) => {
              const statusCard = getStatusCard(trip)
              const isCanceled = trip.status === 'CANCELADA'
              const cardContent = (
                <>
                  <div className="driver-trip-card__details">
                    <h2
                      className="driver-trip-card__route"
                      aria-label={`${trip.origin} para ${trip.destiny}`}
                    >
                      <span>{trip.origin}</span>
                      <span aria-hidden="true">&#8594;</span>
                      <span>{trip.destiny}</span>
                    </h2>
                    <div className="driver-trip-card__meta">
                      <span>{trip.tripDateLabel}</span>
                      <span aria-hidden="true">&#8226;</span>
                      <span>{trip.departureTime}</span>
                    </div>
                    <p className="driver-trip-card__status">
                      Status da viagem: {trip.statusLabel}
                    </p>
                  </div>

                  <div
                    className={`driver-trip-card__side driver-trip-card__side--${statusCard.modifier}`}
                    aria-label={`Status: ${statusCard.label} ${statusCard.description}`}
                  >
                    <span className="driver-trip-card__side-label">{statusCard.label}</span>
                    <span className="driver-trip-card__side-description">
                      {statusCard.description}
                    </span>
                  </div>

                  <span
                    className={`driver-trip-card__action${isCanceled ? ' driver-trip-card__action--disabled' : ''}`}
                  >
                    <span className="driver-trip-card__action-label">
                      {isCanceled ? 'Indisponível' : 'Selecionar'}
                    </span>
                    <span className="driver-trip-card__action-description">
                      {isCanceled ? 'Viagem cancelada' : 'Abrir viagem'}
                      {isCanceled ? null : <ArrowRightIcon aria-hidden="true" weight="bold" />}
                    </span>
                  </span>
                </>
              )

              return isCanceled ? (
                <article key={trip.id} className="driver-trip-card">
                  {cardContent}
                </article>
              ) : (
                <Link
                  key={trip.id}
                  className="driver-trip-card driver-trip-card--link"
                  to="/app/driver/viajem/$tripId"
                  params={{ tripId: String(trip.id) }}
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
