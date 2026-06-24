import { ArrowRight, Bus, MapPinLine } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import MotoristaLayout from '@layout/motorista-layout'

import { useAuthStore } from '@/features/auth/store/auth-store'
import { apiFetch } from '@/lib/api'
import { normalizeTripTime } from '@/features/trips/utils/time'
import { getStatusTone } from '@/features/user-home/config'

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
  driver?: string | null
  bus_plate?: string | null
  students_count?: number
  servants_count?: number
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
  driverId: string | null
  busPlate: string | null
  studentsCount: number
  servantsCount: number
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

function normalizeTripFromModel(trip: TripModel): DriverTrip {
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
    driverId: trip.driver ?? null,
    busPlate: trip.bus_plate ?? null,
    studentsCount: trip.students_count ?? 0,
    servantsCount: trip.servants_count ?? 0,
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

async function getTripsHistoryFromApi() {
  try {
    const response = await apiFetch(`/trips/history/`)
    const data = response as TripModel[]
    return data
      .map((trip) => normalizeTripFromModel(trip))
      .sort((first, second) => second.departureTime.localeCompare(first.departureTime))
  } catch {
    return []
  }
}

const baseCardClass =
  'block rounded-4xl border border-border/80 bg-card px-4 md:px-5 py-3 md:py-4 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer'

function TripCard({ trip, isCanceled, isInProgress }: { trip: DriverTrip; isCanceled: boolean; isInProgress: boolean }) {
  const statusTone = getStatusTone(trip.status)

  const cardContent = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2
          className="flex items-center gap-1.5 min-w-0 flex-1 text-foreground text-base md:text-xl font-heading leading-[1.2] font-medium"
          aria-label={`${trip.origin} para ${trip.destiny}`}
        >
          <MapPinLine size={16} weight="duotone" className="shrink-0 text-primary md:size-5" />
          <span className="wrap-break-words">{trip.origin}</span>
          <span aria-hidden="true" className="text-muted-foreground/50 mx-0.5">&rarr;</span>
          <span className="wrap-break-words">{trip.destiny}</span>
        </h2>

        <span className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ring-1 ${statusTone}`}>
          {trip.statusLabel}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1.5 md:gap-2">
        <div className="rounded-xl bg-muted/30 px-2.5 py-1.5 md:p-2.5">
          <p className="text-[9px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">Data</p>
          <p className="mt-0.5 text-xs md:text-sm font-semibold">{trip.tripDateLabel}</p>
        </div>
        <div className="rounded-xl bg-muted/30 px-2.5 py-1.5 md:p-2.5">
          <p className="text-[9px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">Partida</p>
          <p className="mt-0.5 text-xs md:text-sm font-semibold">{trip.departureTime}</p>
        </div>
        {trip.busPlate ? (
          <div className="rounded-xl bg-muted/30 px-2.5 py-1.5 md:p-2.5">
            <p className="text-[9px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">Ônibus</p>
            <p className="mt-0.5 text-xs md:text-sm font-semibold">{trip.busPlate}</p>
          </div>
        ) : null}
        <div className="rounded-xl bg-muted/30 px-2.5 py-1.5 md:p-2.5">
          <p className="text-[9px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">Passageiros</p>
          <p className="mt-0.5 text-xs md:text-sm font-semibold">
            {trip.studentsCount} alunos · {trip.servantsCount} servidores
          </p>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-border/50">
        {isCanceled ? (
          <div className="flex items-center justify-center gap-2 py-1.5 md:py-2 rounded-2xl bg-muted text-muted-foreground text-sm font-semibold">
            <Bus size={16} />
            Viagem cancelada
          </div>
        ) : isInProgress ? (
          <div className="flex items-center justify-center gap-2 py-2 md:py-2.5 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold shadow-sm">
            <span className="text-base">&rarr;</span>
            Retomar Viagem
            <span className="hidden sm:inline text-[10px] font-normal text-primary-foreground/70">— Você está conduzindo esta viagem</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1.5 py-2 md:py-2.5 rounded-2xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/15 transition-colors">
            Abrir Viagem
            <ArrowRight size={16} weight="bold" />
          </div>
        )}
      </div>
    </>
  )

  if (isCanceled) {
    return (
      <article className={`${baseCardClass} opacity-60 cursor-not-allowed`}>
        {cardContent}
      </article>
    )
  }

  return (
    <Link
      className={`${baseCardClass} no-underline text-current`}
      to="/app/motorista/viagem/$tripId"
      params={{ tripId: trip.id }}
      aria-label={`Abrir detalhes da viagem ${trip.origin} para ${trip.destiny}`}
    >
      {cardContent}
    </Link>
  )
}

export function MotoristaHomePage() {
  const authDriverId = useAuthStore((s) => s.user?.driver_profile?.id)
  const [profileDriverId, setProfileDriverId] = useState<string | null | undefined>(undefined)
  const [trips, setTrips] = useState<DriverTrip[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [historyTrips, setHistoryTrips] = useState<DriverTrip[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)

  const driverProfileId = authDriverId ?? profileDriverId ?? undefined

  useEffect(() => {
    if (authDriverId !== undefined) return
    apiFetch<{ driver_profile?: { id: string } }>('/profile/')
      .then((data) => setProfileDriverId(data?.driver_profile?.id ?? null))
      .catch(() => setProfileDriverId(null))
  }, [authDriverId])

  const activeTrips = trips.filter((t) => t.driverId != null && t.driverId === driverProfileId)
  const todayTrips = trips.filter((t) => t.driverId == null || t.driverId !== driverProfileId)

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

  useEffect(() => {
    let isMounted = true

    const loadHistory = async () => {
      const data = await getTripsHistoryFromApi()
      if (isMounted) {
        setHistoryTrips(data)
        setHistoryLoaded(true)
      }
    }

    loadHistory()

    return () => {
      isMounted = false
    }
  }, [])

  const finishedHistoryTrips = historyTrips.filter(
    (t) => t.status === 'CONCLUÍDA' || t.status === 'CONCLUIDA' || t.status === 'CANCELADA',
  )

  return (
    <MotoristaLayout>
      <section aria-labelledby="driver-trips-title" className="mx-auto w-full max-w-5xl px-4 mt-8">
        {error ? (
          <div className="rounded-4xl border border-border/70 bg-card/95 px-4 md:px-6 py-3 md:py-5 shadow-sm mb-6">
            <p className="text-center text-destructive font-semibold">{error}</p>
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-4xl border border-border/70 bg-card/95 px-4 md:px-6 py-3 md:py-5 shadow-sm">
            <p className="text-center text-muted-foreground font-semibold">Carregando viagens do dia...</p>
          </div>
        ) : (
          <>
            {activeTrips.length > 0 ? (
              <section className="mb-12 md:mb-16">
                <h2 className="font-heading text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight mb-2">
                  Suas Viagens
                </h2>
                <p className="max-w-[44rem] mb-5 text-muted-foreground text-xs md:text-sm leading-[1.55]">
                  Viagens que você está cadastrado atualmente.
                </p>
                <div className="grid gap-4">
                  {activeTrips.map((trip) => (
                    <TripCard key={trip.id} trip={trip} isCanceled={false} isInProgress={trip.status === 'EM ANDAMENTO'} />
                  ))}
                </div>
              </section>
            ) : null}

            <section className="mt-8 md:mt-12">
              <h2 className="font-heading text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight mb-2">
                  Viagens de Hoje
              </h2>
              <p className="max-w-[44rem] mb-5 text-muted-foreground text-xs md:text-sm leading-[1.55]">
                Viagens cadastradas para hoje.
              </p>

              {todayTrips.length === 0 ? (
                <div className="rounded-4xl border border-border/70 bg-card/95 px-4 md:px-6 py-3 md:py-5 shadow-sm">
                  <p className="text-center text-muted-foreground font-semibold">Nenhuma outra viagem hoje.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {todayTrips.map((trip) => (
                    <TripCard
                      key={trip.id}
                      trip={trip}
                      isCanceled={trip.status === 'CANCELADA'}
                      isInProgress={false}
                    />
                  ))}
                </div>
              )}
            </section>

            {historyLoaded && finishedHistoryTrips.length > 0 ? (
              <section className="mt-8 md:mt-12">
                <h2 className="font-heading text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight mb-2">
                  Histórico de Viagens
                </h2>
                <p className="max-w-[44rem] mb-5 text-muted-foreground text-xs md:text-sm leading-[1.55]">
                  Viagens finalizadas e canceladas.
                </p>
                <div className="grid gap-4">
                  {finishedHistoryTrips.map((trip) => (
                    <TripCard
                      key={trip.id}
                      trip={trip}
                      isCanceled={trip.status === 'CANCELADA'}
                      isInProgress={false}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </section>
    </MotoristaLayout>
  )
}
