import {
  BusIcon,
  QrCodeIcon,
  SignOutIcon,
  UserPlusIcon,
  UsersThreeIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react'
import { useEffect, useState } from 'react'

import logo from '@assets/logo-light-mode.svg'
import { apiFetch } from '@lib/api'
import MotoraLayout from '@layout/Motora-layout'

import './ViajemMotorista.css'

type PassengerBoardItem = {
  id: number
  name: string
  source: 'QR' | 'Manual'
}

type DriverTripDetail = {
  id: string
  origin: string
  destiny: string
  departureTime: string
  busPlate: string
  busId: number | null
  capacity: number
  associatedBuses: number
  passengers: PassengerBoardItem[]
}

type ApiList<T> = T[] | { results?: T[] }

type TripModel = {
  id: number
  origin?: string | null
  destiny?: string | null
  departure_timestamp?: string | null
  departure_time?: string | null
  active_reservations?: number | null
  seating_capacity?: number | null
  bus?: number | null
  bus_number_plate?: string | null
}

type CurrentTripModel = {
  id: number
  origin?: string | null
  destiny?: string | null
  departure_time?: string | null
  bus_number_plate?: string | null
}

type BusModel = {
  id: number
  number_plate?: string
  plate?: string
  bus_number_plate?: string
  seating_capacity?: number
  capacity?: number
}

type DriverBusOption = {
  id: number
  plate: string
  capacity: number | null
}

type ViajemMotoristaProps = {
  tripId?: string
}

function toList<T>(payload: ApiList<T>): T[] {
  return Array.isArray(payload) ? payload : payload.results ?? []
}

function normalizeTime(time?: string | null) {
  if (!time) {
    return '00:00'
  }

  if (/^\d{4}-\d{2}-\d{2}T/.test(time)) {
    return time.slice(14, 19)
  }

  const timeMatch = time.match(/\d{2}:\d{2}/)

  if (timeMatch) {
    return timeMatch[0]
  }

  const date = new Date(time)

  if (Number.isNaN(date.getTime())) {
    return '00:00'
  }

  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function normalizeCapacity(capacity?: number | null) {
  return typeof capacity === 'number' && capacity > 0 ? capacity : 46
}

function createPassengerPlaceholders(totalPassengers?: number | null): PassengerBoardItem[] {
  const passengerCount =
    typeof totalPassengers === 'number' && totalPassengers > 0 ? totalPassengers : 0

  return Array.from({ length: passengerCount }, (_, index) => {
    const id = index + 1

    return {
      id,
      name: `Passageiro ${String(id).padStart(3, '0')}`,
      source: 'Manual' as const,
    }
  })
}

function normalizeTripDetail(trip: TripModel, currentTrip: CurrentTripModel | null) {
  const capacity = normalizeCapacity(trip.seating_capacity)

  return {
    id: String(trip.id),
    origin: currentTrip?.origin ?? trip.origin ?? 'Origem',
    destiny: currentTrip?.destiny ?? trip.destiny ?? 'Destino',
    departureTime: normalizeTime(
      currentTrip?.departure_time ?? trip.departure_time ?? trip.departure_timestamp,
    ),
    busPlate: currentTrip?.bus_number_plate ?? trip.bus_number_plate ?? '',
    busId: trip.bus ?? null,
    capacity,
    associatedBuses: trip.bus ? 1 : 0,
    passengers: createPassengerPlaceholders(
      Math.min(trip.active_reservations ?? 0, capacity),
    ),
  }
}

async function getTripFromApi(tripId: string) {
  const [trip, currentTrip] = await Promise.all([
    apiFetch<TripModel>(`/trips/${tripId}/`),
    apiFetch<CurrentTripModel>(`/trips/${tripId}/current/`).catch(() => null),
  ])

  return normalizeTripDetail(trip, currentTrip)
}

function normalizeBusOption(bus: BusModel): DriverBusOption | null {
  const plate = bus.number_plate ?? bus.plate ?? bus.bus_number_plate
  const capacity = bus.seating_capacity ?? bus.capacity ?? null

  if (!plate) {
    return null
  }

  return {
    id: bus.id,
    plate,
    capacity: typeof capacity === 'number' ? capacity : null,
  }
}

async function getBusesFromApi() {
  const payload = await apiFetch<ApiList<BusModel>>('/buses/')

  return toList(payload)
    .map(normalizeBusOption)
    .filter((bus): bus is DriverBusOption => Boolean(bus))
}

export function ViajemMotorista({ tripId }: ViajemMotoristaProps) {
  const [trip, setTrip] = useState<DriverTripDetail | null>(null)
  const [isTripLoading, setIsTripLoading] = useState(true)
  const [tripError, setTripError] = useState<string | null>(null)
  const [boardedPassengers, setBoardedPassengers] = useState<PassengerBoardItem[]>([])
  const [confirmation, setConfirmation] = useState<'back' | 'bus' | null>(null)
  const [busOptions, setBusOptions] = useState<DriverBusOption[]>([])
  const [selectedBusId, setSelectedBusId] = useState<number | null>(null)
  const tripBusId = trip?.busId ?? null
  const tripBusPlate = trip?.busPlate ?? ''
  const selectedBus = busOptions.find((bus) => bus.id === selectedBusId) ?? null
  const activeCapacity = selectedBus?.capacity ?? trip?.capacity ?? 46
  const embarkedCount = boardedPassengers.length
  const qrCount = boardedPassengers.filter((passenger) => passenger.source === 'QR').length
  const manualCount = boardedPassengers.filter((passenger) => passenger.source === 'Manual').length
  const occupancyPercent = Math.min((embarkedCount / activeCapacity) * 100, 100)
  const shouldWarnBeforeRequestingBus = (trip?.associatedBuses ?? 0) >= 2
  const hasReachedCapacity = embarkedCount >= activeCapacity
  const whatsappRequestUrl =
    'https://wa.me/?text=Solicito%20um%20novo%20onibus%20para%20esta%20viagem.'

  useEffect(() => {
    let isMounted = true

    const loadTrip = async () => {
      if (!tripId) {
        setTrip(null)
        setTripError('Viagem nao encontrada.')
        setIsTripLoading(false)
        return
      }

      setIsTripLoading(true)
      setTripError(null)

      try {
        const tripDetail = await getTripFromApi(tripId)

        if (isMounted) {
          setTrip(tripDetail)
        }
      } catch (error) {
        console.warn('Nao foi possivel carregar a viagem selecionada:', error)

        if (isMounted) {
          setTrip(null)
          setTripError('Nao foi possivel carregar a viagem selecionada.')
        }
      } finally {
        if (isMounted) {
          setIsTripLoading(false)
        }
      }
    }

    loadTrip()

    return () => {
      isMounted = false
    }
  }, [tripId])

  useEffect(() => {
    setBoardedPassengers(trip ? [...trip.passengers] : [])
  }, [trip])

  useEffect(() => {
    let isMounted = true

    const loadBuses = async () => {
      try {
        const buses = await getBusesFromApi()

        if (!isMounted) {
          return
        }

        setBusOptions(buses)
        setSelectedBusId((currentBusId) => {
          if (tripBusId && buses.some((bus) => bus.id === tripBusId)) {
            return tripBusId
          }

          const matchingBus = tripBusPlate
            ? buses.find((bus) => bus.plate === tripBusPlate)
            : null

          if (matchingBus) {
            return matchingBus.id
          }

          if (tripBusId === null) {
            return null
          }

          return currentBusId && buses.some((bus) => bus.id === currentBusId)
            ? currentBusId
            : null
        })
      } catch (error) {
        console.warn('Nao foi possivel carregar os onibus cadastrados:', error)

        if (isMounted) {
          setBusOptions([])
          setSelectedBusId(null)
        }
      }
    }

    loadBuses()

    return () => {
      isMounted = false
    }
  }, [tripBusId, tripBusPlate])

  const handleAddPassenger = () => {
    setBoardedPassengers((currentPassengers) => {
      if (currentPassengers.length >= activeCapacity) {
        return currentPassengers
      }

      const nextId = currentPassengers.length + 1

      return [
        ...currentPassengers,
        {
          id: nextId,
          name: `Passageiro ${String(nextId).padStart(3, '0')}`,
          source: 'Manual',
        },
      ]
    })
  }

  const handleFillBus = () => {
    setBoardedPassengers((currentPassengers) => {
      if (currentPassengers.length >= activeCapacity) {
        return currentPassengers
      }

      const passengersToAdd = Array.from(
        { length: activeCapacity - currentPassengers.length },
        (_, index) => {
          const nextId = currentPassengers.length + index + 1

          return {
            id: nextId,
            name: `Passageiro ${String(nextId).padStart(3, '0')}`,
            source: 'Manual' as const,
          }
        },
      )

      return [...currentPassengers, ...passengersToAdd]
    })
  }

  if (isTripLoading) {
    return (
      <MotoraLayout user={{ name: 'Motorista', kind: 'driver' }}>
        <section className="driver-trip-screen" aria-labelledby="driver-trip-screen-title">
          <div className="driver-trip-screen__panel">
            <p id="driver-trip-screen-title" className="driver-trip-screen__feedback">
              Carregando viagem selecionada...
            </p>
          </div>
        </section>
      </MotoraLayout>
    )
  }

  if (tripError || !trip) {
    return (
      <MotoraLayout user={{ name: 'Motorista', kind: 'driver' }}>
        <section className="driver-trip-screen" aria-labelledby="driver-trip-screen-title">
          <div className="driver-trip-screen__panel">
            <div className="driver-trip-screen__feedback">
              <h1 id="driver-trip-screen-title">Viagem indisponivel</h1>
              <p>{tripError ?? 'Nao foi possivel encontrar a viagem selecionada.'}</p>
              <a href="/app/driver/viagens">Voltar para viagens</a>
            </div>
          </div>
        </section>
      </MotoraLayout>
    )
  }

  return (
    <MotoraLayout user={{ name: 'Motorista', kind: 'driver' }}>
      <section className="driver-trip-screen" aria-labelledby="driver-trip-screen-title">
        <div className="driver-trip-screen__panel">
          <header className="driver-trip-screen__header">
            <button
              type="button"
              className="driver-trip-screen__back"
              onClick={() => setConfirmation('back')}
            >
              <SignOutIcon aria-hidden="true" weight="bold" />
              VOLTAR
            </button>

            <div className="driver-trip-screen__brand" aria-label="EasyRota">
              <img src={logo} alt="" />
              <span>
                <strong>Easy</strong>Rota
              </span>
            </div>
          </header>

          <div className="driver-trip-screen__body">
            <section className="driver-trip-control" aria-labelledby="driver-trip-screen-title">
              <div className="driver-trip-control__route">
                <p>Viagem atual</p>
                <h1 id="driver-trip-screen-title">
                  {trip.origin} <span>para</span> {trip.destiny}
                </h1>
                <div className="driver-trip-control__meta">
                  <span>{trip.departureTime}</span>
                  <label className="driver-trip-control__bus-select">
                    <BusIcon aria-hidden="true" weight="fill" />
                    <select
                      aria-label="Selecionar onibus da viagem"
                      value={selectedBusId ?? ''}
                      onChange={(event) => {
                        const nextBusId = event.target.value

                        setSelectedBusId(nextBusId ? Number(nextBusId) : null)
                      }}
                    >
                      <option value="">Sem onibus</option>
                      {busOptions.map((bus) => (
                        <option key={bus.id} value={bus.id}>
                          {bus.plate}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="driver-trip-occupancy" aria-label="Lotação do ônibus">
                <div className="driver-trip-occupancy__bar" aria-hidden="true">
                  <span style={{ width: `${occupancyPercent}%` }} />
                </div>
                <strong>
                  {embarkedCount}/{activeCapacity}
                </strong>
              </div>

              <div className="driver-trip-actions" aria-label="Ações da viagem">
                <button type="button" onClick={handleAddPassenger} disabled={hasReachedCapacity}>
                  <UserPlusIcon aria-hidden="true" weight="bold" />
                  ADD Passageiro
                </button>
                <button type="button" onClick={handleFillBus} disabled={hasReachedCapacity}>
                  <UsersThreeIcon aria-hidden="true" weight="bold" />
                  Lotar Onibus
                </button>
                <button
                  type="button"
                  className="driver-trip-actions__wide"
                  onClick={() => {
                    if (shouldWarnBeforeRequestingBus) {
                      setConfirmation('bus')
                    }
                  }}
                >
                  <BusIcon aria-hidden="true" weight="bold" />
                  Solicitar novo onibus
                </button>
              </div>
            </section>

            <aside className="driver-trip-side" aria-label="Leitura de QR e lotação">
              <div className="driver-trip-qr">
                <div className="driver-trip-qr__code" aria-hidden="true">
                  <QrCodeIcon weight="bold" />
                </div>
                <strong>LER QR</strong>
              </div>

              <section className="driver-trip-passengers" aria-labelledby="driver-passengers-title">
                <h2 id="driver-passengers-title">Controle de lotação</h2>
                <p>
                  A barra usa uma lista interna de embarques para calcular o total ocupado.
                </p>
                <div className="driver-trip-passengers__stats" aria-label="Resumo dos embarques">
                  <span>
                    <strong>{embarkedCount}</strong>
                    embarcados
                  </span>
                  <span>
                    <strong>{qrCount}</strong>
                    QR
                  </span>
                  <span>
                    <strong>{manualCount}</strong>
                    manual
                  </span>
                </div>
              </section>
            </aside>
          </div>

          <a
            className="driver-trip-alert-button"
            href={whatsappRequestUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Enviar alerta pelo WhatsApp"
          >
            <WarningCircleIcon aria-hidden="true" weight="bold" />
          </a>
        </div>

        {confirmation ? (
          <div className="driver-trip-confirmation" role="dialog" aria-modal="true">
            <div className="driver-trip-confirmation__card">
              <WarningCircleIcon aria-hidden="true" weight="fill" />
              <h2>
                {confirmation === 'back' ? 'Atenção ao voltar' : 'Solicitar novo ônibus'}
              </h2>
              <p>
                {confirmation === 'back'
                  ? 'Se o motorista voltar, ele será desassociado da viagem.'
                  : 'já existem 2 onibus associados a essa viajem, deseja solicitar mais?'}
              </p>
              <div className="driver-trip-confirmation__actions">
                <button type="button" onClick={() => setConfirmation(null)}>
                  Cancelar
                </button>
                {confirmation === 'back' ? (
                  <a href="/app/driver/viagens">OK</a>
                ) : (
                  <a href={whatsappRequestUrl} target="_blank" rel="noreferrer">
                    OK
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </MotoraLayout>
  )
}
