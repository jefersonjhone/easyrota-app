import {
  BusIcon,
  CheckCircleIcon,
  PlayCircleIcon,
  QrCodeIcon,
  SignOutIcon,
  UserPlusIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react'
import { type FormEvent, useCallback, useEffect, useState } from 'react'

import { checkInTripPassenger } from '@features/trips/services/trips'
import { apiFetch } from '@lib/api'
import MotoraLayout from '@layout/Motora-layout'
import { Button } from '@ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@ui/dialog'
import { Input } from '@ui/input'
import { Label } from '@ui/label'
import { NativeSelect, NativeSelectOption } from '@ui/native-select'
import { cn } from '@utils'

import { QrCodeScanner } from './QrCodeScanner'

type PassengerBoardItem = {
  id: number
  name: string
  source: 'QR' | 'Manual'
  kind?: PassengerKind
  identifier?: string
  reservationId?: number
}

type PassengerKind = 'Servidor' | 'Convidado'

type DriverTripDetail = {
  id: string
  origin: string
  destiny: string
  departureTime: string
  busPlate: string
  busId: number | null
  driverId: number | null
  isDriverAssociated: boolean
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
  driver?: number | null
  bus_number_plate?: string | null
  status?: string | null
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

type QrFeedback = {
  kind: 'success' | 'error' | 'info'
  message: string
}

function toList<T>(payload: ApiList<T>): T[] {
  return Array.isArray(payload) ? payload : payload.results ?? []
}

function normalizeTime(time?: string | null) {
  if (!time) {
    return '00:00'
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

function normalizeTripDetail(trip: TripModel) {
  const capacity = normalizeCapacity(trip.seating_capacity)
  const driverId = typeof trip.driver === 'number' ? trip.driver : null

  return {
    id: String(trip.id),
    origin: trip.origin ?? 'Origem',
    destiny: trip.destiny ?? 'Destino',
    departureTime: normalizeTime(
      trip.departure_time ?? trip.departure_timestamp,
    ),
    busPlate: trip.bus_number_plate ?? '',
    busId: trip.bus ?? null,
    driverId,
    isDriverAssociated: driverId !== null,
    capacity,
    associatedBuses: trip.bus ? 1 : 0,
    status: trip.status ?? '',
    passengers: createPassengerPlaceholders(
      Math.min(trip.active_reservations ?? 0, capacity),
    ),
  }
}

async function getTripFromApi(tripId: string) {
  const trip = await apiFetch<TripModel>(`/trips/${tripId}/`)

  return normalizeTripDetail(trip)
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

function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { error?: string; detail?: string } | null }).data

    return data?.error ?? data?.detail ?? fallback
  }

  return fallback
}

function FeedbackBanner({ feedback }: { feedback: QrFeedback | null }) {
  if (!feedback) {
    return null
  }

  return (
    <p
      role={feedback.kind === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-lg border px-4 py-3 text-sm font-semibold',
        feedback.kind === 'success'
          ? 'border-green-200 bg-green-50 text-green-800'
          : feedback.kind === 'error'
            ? 'border-red-200 bg-red-50 text-red-800'
            : 'border-sky-200 bg-sky-50 text-sky-800',
      )}
    >
      {feedback.message}
    </p>
  )
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
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false)
  const [isQrCheckInLoading, setIsQrCheckInLoading] = useState(false)
  const [qrFeedback, setQrFeedback] = useState<QrFeedback | null>(null)
  const [scanRestartSignal, setScanRestartSignal] = useState(0)
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
  const isTripFinished = normalizedTripStatus.startsWith('CONCLUI')
  const isStartTripDisabled = isConfirmationLoading || isTripInProgress || isTripFinished
  const isFinishTripDisabled = isConfirmationLoading || isTripFinished
  const canReadQr = Boolean(trip?.isDriverAssociated)
  const qrAccessMessage = !trip?.isDriverAssociated
    ? 'Associe-se a esta viagem antes de ler QR Code.'
    : null
  const whatsappAlertUrl = `https://wa.me/?text=${encodeURIComponent(
    `Estou com problema no onibus ${selectedBusPlate} na viajem de ${trip?.origin ?? 'Origem'} para ${trip?.destiny ?? 'Destino'}`,
  )}`
  const whatsappRequestUrl = `https://wa.me/?text=${encodeURIComponent(
    `Solicito novo onibus para a viajem de ${trip?.origin ?? 'Origem'} para ${trip?.destiny ?? 'Destino'}`,
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
      setActionError(null)
      setQrFeedback(null)

      try {
        const tripDetail = await getTripFromApi(tripId)
        let nextTripDetail = { ...tripDetail, isDriverAssociated: false }
        let driverAssociationError: string | null = null

        try {
          await assignDriverToTrip(tripDetail.id)
          nextTripDetail = { ...tripDetail, isDriverAssociated: true }
        } catch (error) {
          console.warn('Nao foi possivel associar o motorista a viagem:', error)
          driverAssociationError = getApiErrorMessage(
            error,
            'Motorista nao autorizado para esta viagem.',
          )
        }

        if (isMounted) {
          setTrip(nextTripDetail)

          if (driverAssociationError) {
            setActionError(driverAssociationError)
            setQrFeedback({
              kind: 'error',
              message: driverAssociationError,
            })
          }
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
    const nextBus = busOptions.find((bus) => bus.id === nextBusId) ?? null

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

      setTrip((currentTrip) =>
        currentTrip
          ? {
              ...currentTrip,
              busId: nextBusId,
              busPlate: nextBus?.plate ?? currentTrip.busPlate,
              isDriverAssociated: nextBusId ? true : currentTrip.isDriverAssociated,
              associatedBuses: nextBusId ? Math.max(currentTrip.associatedBuses, 1) : 0,
            }
          : currentTrip,
      )
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

  const handleOpenQrScanner = () => {
    if (!trip?.isDriverAssociated) {
      setQrFeedback({
        kind: 'error',
        message: 'Motorista nao autorizado para esta viagem.',
      })
      return
    }

    setQrFeedback({
      kind: 'info',
      message: 'Aguardando leitura do QR Code.',
    })
    setIsQrScannerOpen(true)
  }

  const handleQrCameraError = useCallback((message: string) => {
    setQrFeedback({ kind: 'error', message })
  }, [])

  const handleQrScan = useCallback(
    async (decodedText: string) => {
      if (!trip) {
        setQrFeedback({ kind: 'error', message: 'Viagem nao encontrada.' })
        return
      }

      if (!decodedText) {
        setQrFeedback({ kind: 'error', message: 'QR Code invalido.' })
        return
      }

      setIsQrCheckInLoading(true)
      setQrFeedback({
        kind: 'info',
        message: 'QR Code lido. Confirmando check-in...',
      })

      try {
        const response = await checkInTripPassenger(trip.id, decodedText)
        const passengerName = response.passenger_name ?? 'Passageiro'
        const reservationId = response.reservation_id

        setBoardedPassengers((currentPassengers) => {
          const alreadyRegistered = currentPassengers.some(
            (passenger) =>
              passenger.identifier === decodedText
              || (reservationId !== undefined && passenger.reservationId === reservationId),
          )

          if (alreadyRegistered) {
            return currentPassengers
          }

          const passengerFromQr = {
            id: reservationId ?? currentPassengers.length + 1,
            reservationId,
            identifier: decodedText,
            name: passengerName,
            source: 'QR' as const,
          }
          const placeholderIndex = currentPassengers.findIndex(
            (passenger) =>
              passenger.source === 'Manual'
              && passenger.identifier === undefined
              && passenger.name.startsWith('Passageiro '),
          )

          if (placeholderIndex === -1) {
            return [...currentPassengers, passengerFromQr]
          }

          return currentPassengers.map((passenger, index) =>
            index === placeholderIndex
              ? { ...passengerFromQr, id: reservationId ?? passenger.id }
              : passenger,
          )
        })
        setQrFeedback({
          kind: 'success',
          message: response.status ?? `Check-in realizado para ${passengerName}.`,
        })
        setIsQrScannerOpen(false)
      } catch (error) {
        setQrFeedback({
          kind: 'error',
          message: getApiErrorMessage(error, 'Nao foi possivel confirmar o check-in.'),
        })
      } finally {
        setIsQrCheckInLoading(false)
      }
    },
    [trip],
  )

  const handleRetryQrScan = () => {
    setQrFeedback({
      kind: 'info',
      message: 'Aguardando nova leitura do QR Code.',
    })
    setScanRestartSignal((currentSignal) => currentSignal + 1)
  }

  const handlePassengerSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    handleRegisterPassenger()
  }

  const confirmationTitle =
    confirmation === 'back'
      ? 'Atencao ao voltar'
      : confirmation === 'start'
        ? 'Iniciar viagem'
        : confirmation === 'finish'
          ? 'Finalizar viagem'
          : 'Solicitar novo onibus'
  const confirmationDescription =
    confirmation === 'back'
      ? 'Se o motorista voltar, ele sera desassociado da viagem.'
      : confirmation === 'start'
        ? 'Deseja iniciar esta viagem? Esta acao marcara a viagem como em andamento.'
        : confirmation === 'finish'
          ? 'Deseja finalizar esta viagem? Esta acao marcara a viagem como concluida.'
          : 'Ja existem 2 onibus associados a essa viajem, deseja solicitar mais?'

  if (isTripLoading) {
    return (
      <MotoraLayout user={{ name: 'Motorista', kind: 'driver' }}>
        <section className="mx-auto w-[min(100%-1rem,72rem)] sm:w-[min(100%-2rem,72rem)]">
          <div className="grid min-h-56 place-items-center rounded-lg border border-border bg-background p-8 text-center text-sm font-semibold text-muted-foreground shadow-xl">
            Carregando viagem selecionada...
          </div>
        </section>
      </MotoraLayout>
    )
  }

  if (tripError || !trip) {
    return (
      <MotoraLayout user={{ name: 'Motorista', kind: 'driver' }}>
        <section className="mx-auto w-[min(100%-1rem,72rem)] sm:w-[min(100%-2rem,72rem)]">
          <div className="grid min-h-56 place-items-center rounded-lg border border-border bg-background p-8 text-center shadow-xl">
            <div className="grid gap-3">
              <h1 className="font-heading text-2xl font-semibold text-foreground">
                Viagem indisponivel
              </h1>
              <p className="text-sm font-medium text-muted-foreground">
                {tripError ?? 'Nao foi possivel encontrar a viagem selecionada.'}
              </p>
              <Button asChild className="justify-self-center">
                <a href="/app/driver/viagens">Voltar para viagens</a>
              </Button>
            </div>
          </div>
        </section>
      </MotoraLayout>
    )
  }

  return (
    <MotoraLayout user={{ name: 'Motorista', kind: 'driver' }}>
      <section className="mx-auto w-[min(100%-1rem,72rem)] sm:w-[min(100%-2rem,72rem)]" aria-labelledby="driver-trip-screen-title">
        <div className="relative overflow-hidden rounded-lg border border-border bg-background shadow-xl">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/90 p-3 backdrop-blur">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-lg font-bold"
                onClick={() => setConfirmation('back')}
                disabled={isConfirmationLoading}
              >
                <SignOutIcon aria-hidden="true" weight="bold" />
                Voltar
              </Button>
              <Button
                type="button"
                className="rounded-lg border-green-600 bg-green-600 font-bold text-white hover:bg-green-700"
                onClick={() => setConfirmation('start')}
                disabled={isStartTripDisabled}
              >
                <PlayCircleIcon aria-hidden="true" weight="bold" />
                Iniciar viagem
              </Button>
              <Button
                type="button"
                className="rounded-lg font-bold"
                onClick={() => setConfirmation('finish')}
                disabled={isFinishTripDisabled}
              >
                <CheckCircleIcon aria-hidden="true" weight="bold" />
                Finalizar viagem
              </Button>
            </div>
          </header>

          {actionError ? (
            <p
              role="alert"
              className="border-b border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-bold text-red-800"
            >
              {actionError}
            </p>
          ) : null}

          <div className="grid gap-6 p-4 pb-20 md:grid-cols-[minmax(0,1fr)_18rem] md:p-8 md:pb-20">
            <section className="flex min-h-[22rem] flex-col items-center justify-center text-center md:min-h-[27rem]" aria-labelledby="driver-trip-screen-title">
              <div className="grid gap-3">
                <p className="text-xs font-bold uppercase text-primary">
                  Viagem atual
                </p>
                <h1 id="driver-trip-screen-title" className="font-heading text-3xl font-semibold leading-tight text-foreground md:text-5xl">
                  {trip.origin} <span className="font-sans text-xl font-semibold text-muted-foreground md:text-2xl">para</span> {trip.destiny}
                </h1>
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="rounded-full border border-border bg-background px-3 py-1 text-sm font-semibold text-muted-foreground">
                    {trip.departureTime}
                  </span>
                  <label className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-2 py-1 text-sm font-semibold text-muted-foreground">
                    <BusIcon aria-hidden="true" weight="fill" className="size-4 text-foreground" />
                    <NativeSelect
                      aria-label="Selecionar onibus da viagem"
                      value={selectedBusId ?? ''}
                      disabled={isBusActionLoading}
                      onChange={(event) => {
                        const nextBusId = event.target.value

                        void handleBusSelection(nextBusId ? Number(nextBusId) : null)
                      }}
                      className="w-40"
                      size="sm"
                    >
                      <NativeSelectOption value="">Sem onibus</NativeSelectOption>
                      {busOptions.map((bus) => (
                        <NativeSelectOption key={bus.id} value={bus.id}>
                          {bus.plate}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </label>
                </div>
              </div>

              <div className="mt-8 grid w-full max-w-md gap-2">
                <div className="h-8 overflow-hidden rounded-full border-2 border-foreground bg-background">
                  <span
                    className="block h-full rounded-full bg-primary transition-[width]"
                    style={{ width: `${occupancyPercent}%` }}
                  />
                </div>
                <strong className="text-sm font-black text-foreground">
                  {embarkedCount}/{activeCapacity}
                </strong>
              </div>

              <div className="mt-6 grid w-full max-w-md gap-3">
                <Button
                  type="button"
                  className="min-h-12 rounded-lg font-bold"
                  onClick={handleAddPassenger}
                  disabled={hasReachedCapacity}
                >
                  <UserPlusIcon aria-hidden="true" weight="bold" />
                  Add passageiro
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-12 rounded-lg font-bold"
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
                </Button>
              </div>
            </section>

            <aside className="grid content-start gap-4" aria-label="Leitura de QR e lotacao">
              <button
                type="button"
                className={cn(
                  'grid justify-items-center gap-3 rounded-lg border border-border bg-background p-4 text-center shadow-md transition hover:border-primary hover:shadow-lg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30',
                  !canReadQr && 'opacity-70',
                )}
                onClick={handleOpenQrScanner}
                disabled={isQrCheckInLoading || !canReadQr}
              >
                <span className="grid size-32 place-items-center rounded-lg bg-muted text-foreground">
                  <QrCodeIcon weight="bold" className="size-28" />
                </span>
                <strong className="text-sm font-black uppercase text-foreground">
                  Ler QR
                </strong>
              </button>

              {qrAccessMessage ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
                  {qrAccessMessage}
                </p>
              ) : null}

              <FeedbackBanner feedback={!isQrScannerOpen ? qrFeedback : null} />

              <section className="rounded-lg border border-border bg-background p-4 shadow-md" aria-labelledby="driver-passengers-title">
                <h2 id="driver-passengers-title" className="text-base font-black text-foreground">
                  Controle de lotacao
                </h2>
                <div className="mt-4 grid grid-cols-3 gap-2" aria-label="Resumo dos embarques">
                  <span className="grid min-h-20 place-items-center rounded-lg border border-border bg-muted/30 p-2 text-center text-xs font-bold text-muted-foreground">
                    <strong className="block text-2xl font-black text-primary">{embarkedCount}</strong>
                    embarcados
                  </span>
                  <span className="grid min-h-20 place-items-center rounded-lg border border-border bg-muted/30 p-2 text-center text-xs font-bold text-muted-foreground">
                    <strong className="block text-2xl font-black text-primary">{qrCount}</strong>
                    QR
                  </span>
                  <span className="grid min-h-20 place-items-center rounded-lg border border-border bg-muted/30 p-2 text-center text-xs font-bold text-muted-foreground">
                    <strong className="block text-2xl font-black text-primary">{manualCount}</strong>
                    manual
                  </span>
                </div>
              </section>
            </aside>
          </div>

          <a
            className="absolute right-5 bottom-5 inline-flex size-10 items-center justify-center rounded-full border border-primary/50 bg-background text-primary shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
            href={whatsappAlertUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Enviar alerta pelo WhatsApp"
          >
            <WarningCircleIcon aria-hidden="true" weight="bold" className="size-6" />
          </a>
        </div>

        <Dialog open={isQrScannerOpen} onOpenChange={setIsQrScannerOpen}>
          <DialogContent className="rounded-lg sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Check-in por QR Code</DialogTitle>
              <DialogDescription>
                Leia o QR Code do passageiro para confirmar a reserva nesta viagem.
              </DialogDescription>
            </DialogHeader>
            <QrCodeScanner
              isOpen={isQrScannerOpen}
              restartSignal={scanRestartSignal}
              onScan={handleQrScan}
              onCameraError={handleQrCameraError}
            />
            <FeedbackBanner feedback={qrFeedback} />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded-lg"
                onClick={() => setIsQrScannerOpen(false)}
              >
                Cancelar leitura
              </Button>
              {qrFeedback?.kind === 'error' ? (
                <Button
                  type="button"
                  className="rounded-lg"
                  onClick={handleRetryQrScan}
                  disabled={isQrCheckInLoading}
                >
                  Ler novamente
                </Button>
              ) : null}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isPassengerMenuOpen} onOpenChange={setIsPassengerMenuOpen}>
          <DialogContent className="rounded-lg sm:max-w-md">
            <form className="grid gap-5" onSubmit={handlePassengerSubmit}>
              <DialogHeader className="items-center text-center">
                <UserPlusIcon aria-hidden="true" weight="fill" className="size-8 text-primary" />
                <DialogTitle>Cadastrar passageiro</DialogTitle>
                <DialogDescription>
                  Adicione um embarque manual para atualizar a lotacao.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-2">
                <Label htmlFor="driver-passenger-name">Nome</Label>
                <Input
                  id="driver-passenger-name"
                  type="text"
                  value={passengerName}
                  onChange={(event) => setPassengerName(event.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="driver-passenger-kind">Tipo</Label>
                <NativeSelect
                  id="driver-passenger-kind"
                  value={passengerKind}
                  onChange={(event) => setPassengerKind(event.target.value as PassengerKind)}
                  className="w-full"
                >
                  <NativeSelectOption value="Servidor">Servidor</NativeSelectOption>
                  <NativeSelectOption value="Convidado">Convidado</NativeSelectOption>
                </NativeSelect>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-lg"
                  onClick={() => setIsPassengerMenuOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="rounded-lg" disabled={!passengerName.trim()}>
                  Cadastrar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog
          open={confirmation !== null}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setConfirmation(null)
            }
          }}
        >
          <DialogContent className="rounded-lg sm:max-w-md">
            <DialogHeader className="items-center text-center">
              <WarningCircleIcon aria-hidden="true" weight="fill" className="size-8 text-primary" />
              <DialogTitle>{confirmationTitle}</DialogTitle>
              <DialogDescription>{confirmationDescription}</DialogDescription>
            </DialogHeader>
            {actionError ? (
              <p role="alert" className="text-sm font-bold text-red-700">
                {actionError}
              </p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded-lg"
                onClick={() => setConfirmation(null)}
                disabled={isConfirmationLoading}
              >
                Cancelar
              </Button>
              {confirmation === 'back' ? (
                <Button
                  type="button"
                  className="rounded-lg"
                  onClick={() => void handleConfirmBack()}
                  disabled={isConfirmationLoading}
                >
                  OK
                </Button>
              ) : confirmation === 'start' ? (
                <Button
                  type="button"
                  className="rounded-lg border-green-600 bg-green-600 text-white hover:bg-green-700"
                  onClick={() => void handleStartTrip()}
                  disabled={isConfirmationLoading}
                >
                  OK
                </Button>
              ) : confirmation === 'finish' ? (
                <Button
                  type="button"
                  className="rounded-lg"
                  onClick={() => void handleFinishTrip()}
                  disabled={isConfirmationLoading}
                >
                  OK
                </Button>
              ) : (
                <Button asChild className="rounded-lg">
                  <a href={whatsappRequestUrl} target="_blank" rel="noreferrer">
                    OK
                  </a>
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </MotoraLayout>
  )
}
