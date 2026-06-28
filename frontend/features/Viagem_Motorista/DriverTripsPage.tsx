import { ArrowRightIcon } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import MotoraLayout from '@layout/Motora-layout'

import './DriverTripsPage.css'
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
  id: number
  trip_date: string
  status: TripModelStatus
  origin?: string
  destiny?: string
  departure_time?: string | null
  departure_timestamp?: string | null
  active_reservations?: number | null
  is_current_driver?: boolean
  is_occupied_by_other_driver?: boolean
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
  reservationCount: number | null
  isCurrentDriver: boolean
  isOccupiedByOtherDriver: boolean
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

function getTodayIso() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
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
  const departureTime = normalizeTripTime(
    trip.departure_time ?? trip.departure_timestamp,
  )

  const reservationCount =
    typeof trip.active_reservations === 'number'
      ? Math.max(trip.active_reservations, 0)
      : null

  return {
    id: trip.id,
    tripDate: normalizeDateToIso(trip.trip_date),
    tripDateLabel: formatDateLabel(trip.trip_date),
    origin : origin? origin : "Origem com erro",
    destiny : destiny? destiny : "Destino com erro",
    departureTime,
    status: trip.status,
    statusLabel: toStatusLabel(trip.status),
    reservationCount,
    isCurrentDriver: trip.is_current_driver === true,
    isOccupiedByOtherDriver: trip.is_occupied_by_other_driver === true,
  }
}

async function getTripsFromApi() {
  
  try {
    const response = await apiFetch(`/trips/`)
    const data = response as TripModel[]
    const todayIso = getTodayIso()

    return data
      .map((trip) => normalizeTripFromModel(trip))
      .filter((trip) => trip.tripDate === todayIso)
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

  if (trip.isOccupiedByOtherDriver) {
    return {
      modifier: 'occupied',
      label: 'Viagem ocupada',
      description: 'outro motorista',
    }
  }


  if (trip.reservationCount !== null) {
    const reservationLabel =
      trip.reservationCount === 1
        ? '1 reserva'
        : `${trip.reservationCount} reservas`

    return {
      modifier: 'available',
      label: reservationLabel,
      description: 'ativas',
    }
  }

  return {
    modifier: 'available',
    label: 'Reservas',
    description: 'ativas',
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
              const isOccupied = trip.isOccupiedByOtherDriver
              const canOpenTrip = !isCanceled && !isOccupied
              const isReturnTrip = trip.isCurrentDriver
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
                    className={`driver-trip-card__action${!canOpenTrip ? ' driver-trip-card__action--disabled' : ''}${isReturnTrip ? ' driver-trip-card__action--return' : ''}`}
                  >
                    <span className="driver-trip-card__action-label">
                      {isCanceled
                        ? 'Indisponível'
                        : isOccupied
                          ? 'Viagem ocupada'
                          : isReturnTrip
                            ? 'Retornar'
                            : 'Selecionar'}
                    </span>
                    <span className="driver-trip-card__action-description">
                      {isCanceled
                        ? 'Viagem cancelada'
                        : isOccupied
                          ? 'Outro motorista associado'
                          : isReturnTrip
                            ? 'Voltar para viagem'
                            : 'Abrir viagem'}
                      {canOpenTrip ? <ArrowRightIcon aria-hidden="true" weight="bold" /> : null}
                    </span>
                  </span>
                </>
              )

              return !canOpenTrip ? (
                <article key={trip.id} className="driver-trip-card">
                  {cardContent}
                </article>
              ) : (
                <Link
                  key={trip.id}
                  className="driver-trip-card driver-trip-card--link"
                  to="/app/driver/viagem/$tripId"
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
