


import {
  BusIcon,
  CheckCircleIcon,
  PlayCircleIcon,
  QrCodeIcon,
  SignOutIcon,
  UserPlusIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react'
import { type CSSProperties, useEffect, useState } from 'react'


import { apiFetch } from '@lib/api'
import MotoraLayout from '@layout/Motora-layout'

import './ViajemMotorista.css'

type PassengerBoardItem = {
  id: number
  name: string
  source: 'QR' | 'Manual'
  kind?: PassengerKind
}

type PassengerKind = 'Servidor' | 'Convidado'

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
  status: string
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
  status?: string | null
}

type CurrentTripModel = {
  id: number
  origin?: string | null
  destiny?: string | null
  departure_time?: string | null
  bus_number_plate?: string | null
  status?: string | null
  status_trip?: string | null
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

const startTripButtonStyle: CSSProperties = {
  borderColor: '#16a34a',
  background: '#16a34a',
  color: '#ffffff',
}

const finishTripButtonStyle: CSSProperties = {
  borderColor: 'var(--primary)',
  background: 'var(--primary)',
  color: 'var(--primary-foreground)',
}

const disabledTripButtonStyle: CSSProperties = {
  borderColor: '#d1d5db',
  background: '#e5e7eb',
  color: '#6b7280',
  cursor: 'not-allowed',
  opacity: 1,
  transform: 'none',
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

function normalizeTripStatus(status?: string | null) {
  return (status ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
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
    status: currentTrip?.status ?? currentTrip?.status_trip ?? trip.status ?? '',
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

async function assignDriverToTrip(tripId: string) {
  await apiFetch(`/trips/${tripId}/assign_driver/`, { method: 'POST' })
}

async function unassignDriverFromTrip(tripId: string) {
  await apiFetch(`/trips/${tripId}/unassign_driver/`, { method: 'POST' })
}

async function assignBusToTrip(tripId: string, busId: number) {
  await apiFetch(`/trips/${tripId}/assign_bus/`, {
    method: 'POST',
    body: JSON.stringify({ bus: busId }),
  })
}

async function unassignBusFromTrip(tripId: string) {
  await apiFetch(`/trips/${tripId}/unassign_bus/`, { method: 'POST' })
}

async function startTrip(tripId: string) {
  await apiFetch(`/trips/${tripId}/start_trip/`, { method: 'POST' })
}

async function finishTrip(tripId: string) {
  await apiFetch(`/trips/${tripId}/finish_trip/`, { method: 'POST' })
}

export function ViajemMotorista({ tripId }: ViajemMotoristaProps) {
  const [trip, setTrip] = useState<DriverTripDetail | null>(null)
  const [isTripLoading, setIsTripLoading] = useState(true)
  const [tripError, setTripError] = useState<string | null>(null)
  const [boardedPassengers, setBoardedPassengers] = useState<PassengerBoardItem[]>([])
  const [confirmation, setConfirmation] = useState<'back' | 'bus' | 'start' | 'finish' | null>(null)
  const [busOptions, setBusOptions] = useState<DriverBusOption[]>([])
  const [selectedBusId, setSelectedBusId] = useState<number | null>(null)
  const [isBusActionLoading, setIsBusActionLoading] = useState(false)
  const [isConfirmationLoading, setIsConfirmationLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isPassengerMenuOpen, setIsPassengerMenuOpen] = useState(false)
  const [passengerName, setPassengerName] = useState('')
  const [passengerKind, setPassengerKind] = useState<PassengerKind>('Servidor')
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
  const selectedBusPlate = selectedBus?.plate ?? trip?.busPlate ?? 'Sem onibus'
  const normalizedTripStatus = normalizeTripStatus(trip?.status)
  const isTripInProgress = normalizedTripStatus === 'EM ANDAMENTO'
  const isTripFinished = normalizedTripStatus.startsWith('CONCLU')
  const isStartTripDisabled = isConfirmationLoading || isTripInProgress || isTripFinished
  const isFinishTripDisabled = isConfirmationLoading || isTripFinished
  const whatsappAlertUrl = `https://wa.me/?text=${encodeURIComponent(
    `Estou com problema no ônibus ${selectedBusPlate} na viajem de ${trip?.origin ?? 'Origem'} para ${trip?.destiny ?? 'Destino'}`,
  )}`
  const whatsappRequestUrl = `https://wa.me/?text=${encodeURIComponent(
    `Solicito novo ônibus para a viajem de ${trip?.origin ?? 'Origem'} para ${trip?.destiny ?? 'Destino'}`,
  )}`

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
  }, [])

  useEffect(() => {
    if (busOptions.length === 0) {
      setSelectedBusId(null)
      return
    }

    if (tripBusId && busOptions.some((bus) => bus.id === tripBusId)) {
      setSelectedBusId(tripBusId)
      return
    }

    const matchingBus = tripBusPlate
      ? busOptions.find((bus) => bus.plate === tripBusPlate)
      : null

    setSelectedBusId(matchingBus?.id ?? null)
  }, [busOptions, tripBusId, tripBusPlate])

  const handleAddPassenger = () => {
    if (hasReachedCapacity) {
      return
    }

    setPassengerName('')
    setPassengerKind('Servidor')
    setIsPassengerMenuOpen(true)
  }

  const handleRegisterPassenger = () => {
    setBoardedPassengers((currentPassengers) => {
      if (currentPassengers.length >= activeCapacity) {
        return currentPassengers
      }

      const nextId = currentPassengers.length + 1
      const nextName = passengerName.trim() || `Passageiro ${String(nextId).padStart(3, '0')}`

      return [
        ...currentPassengers,
        {
          id: nextId,
          name: nextName,
          source: 'Manual',
          kind: passengerKind,
        },
      ]
    })
    setPassengerName('')
    setPassengerKind('Servidor')
    setIsPassengerMenuOpen(false)
  }

  const handleBusSelection = async (nextBusId: number | null) => {
    if (!trip) {
      return
    }

    const previousBusId = selectedBusId

    setSelectedBusId(nextBusId)
    setIsBusActionLoading(true)
    setActionError(null)

    try {
      if (nextBusId) {
        await assignDriverToTrip(trip.id)
        await assignBusToTrip(trip.id, nextBusId)
      } else {
        await unassignBusFromTrip(trip.id)
      }
    } catch (error) {
      console.warn('Nao foi possivel atualizar o onibus da viagem:', error)
      setSelectedBusId(previousBusId)
      setActionError('Nao foi possivel atualizar o onibus da viagem.')
    } finally {
      setIsBusActionLoading(false)
    }
  }

  const handleConfirmBack = async () => {
    if (!trip) {
      return
    }

    setIsConfirmationLoading(true)
    setActionError(null)

    try {
      await unassignDriverFromTrip(trip.id)
      window.location.href = '/app/driver/viagens'
    } catch (error) {
      console.warn('Nao foi possivel desassociar o motorista da viagem:', error)
      setActionError('Nao foi possivel desassociar o motorista antes de voltar.')
      setIsConfirmationLoading(false)
    }
  }

  const handleStartTrip = async () => {
    if (!trip) {
      return
    }

    setIsConfirmationLoading(true)
    setActionError(null)

    try {
      await startTrip(trip.id)
      setTrip((currentTrip) =>
        currentTrip ? { ...currentTrip, status: 'EM ANDAMENTO' } : currentTrip,
      )
      setConfirmation(null)
    } catch (error) {
      console.warn('Nao foi possivel iniciar a viagem:', error)
      setActionError('Nao foi possivel iniciar a viagem.')
    } finally {
      setIsConfirmationLoading(false)
    }
  }

  const handleFinishTrip = async () => {
    if (!trip) {
      return
    }

    setIsConfirmationLoading(true)
    setActionError(null)

    try {
      await finishTrip(trip.id)
      window.location.href = '/app/driver/viagens'
    } catch (error) {
      console.warn('Nao foi possivel finalizar a viagem:', error)
      setActionError('Nao foi possivel finalizar a viagem.')
      setIsConfirmationLoading(false)
    }
  }

  const confirmationTitle =
    confirmation === 'back'
      ? 'Atenção ao voltar'
      : confirmation === 'start'
        ? 'Iniciar viagem'
      : confirmation === 'finish'
        ? 'Finalizar viagem'
        : 'Solicitar novo ônibus'
  const confirmationDescription =
    confirmation === 'back'
      ? 'Se o motorista voltar, ele será desassociado da viagem.'
      : confirmation === 'start'
        ? 'Deseja iniciar esta viagem? Esta acao marcara a viagem como em andamento.'
      : confirmation === 'finish'
        ? 'Deseja finalizar esta viagem? Esta acao marcara a viagem como concluida.'
        : 'já existem 2 onibus associados a essa viajem, deseja solicitar mais?'

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
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '0.65rem',
              }}
            >
              <button
                type="button"
                className="driver-trip-screen__back"
                onClick={() => setConfirmation('back')}
                disabled={isConfirmationLoading}
              >
                <SignOutIcon aria-hidden="true" weight="bold" />
                VOLTAR
              </button>
              <button
                type="button"
                className="driver-trip-screen__back"
                onClick={() => setConfirmation('start')}
                disabled={isStartTripDisabled}
                style={isStartTripDisabled ? disabledTripButtonStyle : startTripButtonStyle}
              >
                <PlayCircleIcon aria-hidden="true" weight="bold" />
                Iniciar viagem
              </button>
              <button
                type="button"
                className="driver-trip-screen__back"
                onClick={() => setConfirmation('finish')}
                disabled={isFinishTripDisabled}
                style={isFinishTripDisabled ? disabledTripButtonStyle : finishTripButtonStyle}
              >
                <CheckCircleIcon aria-hidden="true" weight="bold" />
                Finalizar viagem
              </button>
            </div>

            
          </header>

          {actionError ? (
            <p
              role="alert"
              style={{
                margin: 0,
                borderBottom: '1px solid color-mix(in oklch, #dc2626 28%, var(--border))',
                background: 'color-mix(in oklch, #dc2626 10%, var(--background))',
                padding: '0.75rem 1rem',
                color: '#b91c1c',
                fontSize: '0.86rem',
                fontWeight: 800,
                textAlign: 'center',
              }}
            >
              {actionError}
            </p>
          ) : null}

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
                      disabled={isBusActionLoading}
                      onChange={(event) => {
                        const nextBusId = event.target.value

                        handleBusSelection(nextBusId ? Number(nextBusId) : null)
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
                <button
                  type="button"
                  className="driver-trip-actions__wide driver-trip-actions__primary"
                  onClick={handleAddPassenger}
                  disabled={hasReachedCapacity}
                >
                  <UserPlusIcon aria-hidden="true" weight="bold" />
                  ADD Passageiro
                </button>
                <button
                  type="button"
                  className="driver-trip-actions__wide"
                  onClick={() => {
                    if (shouldWarnBeforeRequestingBus) {
                      setConfirmation('bus')
                    } else {
                      window.open(whatsappRequestUrl, '_blank', 'noreferrer')
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
            href={whatsappAlertUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Enviar alerta pelo WhatsApp"
          >
            <WarningCircleIcon aria-hidden="true" weight="bold" />
          </a>
        </div>

        {isPassengerMenuOpen ? (
          <div className="driver-trip-confirmation" role="dialog" aria-modal="true">
            <form
              className="driver-trip-confirmation__card driver-passenger-form"
              onSubmit={(event) => {
                event.preventDefault()
                handleRegisterPassenger()
              }}
            >
              <UserPlusIcon aria-hidden="true" weight="fill" />
              <h2>Cadastrar passageiro</h2>
              <label>
                Nome
                <input
                  type="text"
                  value={passengerName}
                  onChange={(event) => setPassengerName(event.target.value)}
                  autoFocus
                  required
                />
              </label>
              <label>
                Tipo
                <select
                  value={passengerKind}
                  onChange={(event) => setPassengerKind(event.target.value as PassengerKind)}
                >
                  <option value="Servidor">Servidor</option>
                  <option value="Convidado">Convidado</option>
                </select>
              </label>
              <div className="driver-trip-confirmation__actions">
                <button
                  type="button"
                  onClick={() => setIsPassengerMenuOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" disabled={!passengerName.trim()}>
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {confirmation ? (
          <div className="driver-trip-confirmation" role="dialog" aria-modal="true">
            <div className="driver-trip-confirmation__card">
              <WarningCircleIcon aria-hidden="true" weight="fill" />
              <h2>{confirmationTitle}</h2>
              <p>{confirmationDescription}</p>
              {actionError ? (
                <p role="alert" style={{ color: '#b91c1c', fontWeight: 800 }}>
                  {actionError}
                </p>
              ) : null}
              <div className="driver-trip-confirmation__actions">
                <button
                  type="button"
                  onClick={() => setConfirmation(null)}
                  disabled={isConfirmationLoading}
                >
                  Cancelar
                </button>
                {confirmation === 'back' ? (
                  <button
                    type="button"
                    onClick={handleConfirmBack}
                    disabled={isConfirmationLoading}
                  >
                    OK
                  </button>
                ) : confirmation === 'start' ? (
                  <button
                    type="button"
                    onClick={handleStartTrip}
                    disabled={isConfirmationLoading}
                    style={startTripButtonStyle}
                  >
                    OK
                  </button>
                ) : confirmation === 'finish' ? (
                  <button
                    type="button"
                    onClick={handleFinishTrip}
                    disabled={isConfirmationLoading}
                    style={finishTripButtonStyle}
                  >
                    OK
                  </button>
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
