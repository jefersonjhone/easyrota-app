import {
  BusIcon,
  CheckCircleIcon,
  PlayCircleIcon,
  QrCodeIcon,
  SignOutIcon,
  UserMinusIcon,
  UserPlusIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react'
import { type FormEvent, useCallback, useEffect, useState } from 'react'

import {
  checkInTripPassenger,
  registerLocalTripPassenger,
  removeTripPassenger,
  searchAllowedStaff,
} from '@features/trips/services/trips'
import type { AllowedStaffOption } from '@features/trips/types'
import { normalizeTripTime } from '@features/trips/utils/time'
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
  localPassengerId?: number
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
  checked_in_count?: number | null
  checked_in_passengers?: TripCheckedInPassenger[] | null
  seating_capacity?: number | null
  bus?: number | null
  driver?: number | null
  bus_number_plate?: string | null
  status?: string | null
}

type TripCheckedInPassenger = {
  reservation_id?: number | null
  local_passenger_id?: number | null
  passenger_name?: string | null
  check_in?: boolean | null
  checkin?: boolean | null
  checkin_date?: string | null
  source?: 'QR' | 'Manual' | null
  kind?: PassengerKind | null
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

type ViagemMotoristaProps = {
  tripId?: string
}

type QrFeedback = {
  kind: 'success' | 'error' | 'info'
  message: string
}

function toList<T>(payload: ApiList<T>): T[] {
  return Array.isArray(payload) ? payload : payload.results ?? []
}

function normalizeTripStatus(status?: string | null) {
  return (status ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
}

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
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

function normalizeCheckedInPassengers(trip: TripModel, capacity: number): PassengerBoardItem[] {
  const checkedInPassengers = trip.checked_in_passengers

  if (Array.isArray(checkedInPassengers)) {
    return checkedInPassengers
      .filter((passenger) => passenger.check_in === true || passenger.checkin === true)
      .slice(0, capacity)
      .map((passenger, index) => {
        const fallbackId = index + 1
        const reservationId =
          typeof passenger.reservation_id === 'number' ? passenger.reservation_id : undefined
        const localPassengerId =
          typeof passenger.local_passenger_id === 'number'
            ? passenger.local_passenger_id
            : undefined
        const source = passenger.source === 'Manual' ? 'Manual' : 'QR'

        return {
          id: reservationId ?? localPassengerId ?? fallbackId,
          reservationId,
          localPassengerId,
          identifier: localPassengerId ? `local-${localPassengerId}` : undefined,
          name: passenger.passenger_name ?? `Passageiro ${String(fallbackId).padStart(3, '0')}`,
          source,
          kind: passenger.kind ?? undefined,
        }
      })
  }

  const checkedInCount = Math.min(trip.checked_in_count ?? 0, capacity)

  return createPassengerPlaceholders(checkedInCount).map((passenger) => ({
    ...passenger,
    source: 'QR' as const,
  }))
}

function normalizeTripDetail(trip: TripModel) {
  const capacity = normalizeCapacity(trip.seating_capacity)
  const driverId = typeof trip.driver === 'number' ? trip.driver : null

  return {
    id: String(trip.id),
    origin: trip.origin ?? 'Origem',
    destiny: trip.destiny ?? 'Destino',
    departureTime: normalizeTripTime(
      trip.departure_time ?? trip.departure_timestamp,
    ),
    busPlate: trip.bus_number_plate ?? '',
    busId: trip.bus ?? null,
    driverId,
    isDriverAssociated: driverId !== null,
    capacity,
    associatedBuses: trip.bus ? 1 : 0,
    status: trip.status ?? '',
    passengers: normalizeCheckedInPassengers(trip, capacity),
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

export function ViagemMotorista({ tripId }: ViagemMotoristaProps) {
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
  const [isRemovePassengerMenuOpen, setIsRemovePassengerMenuOpen] = useState(false)
  const [passengerName, setPassengerName] = useState('')
  const [passengerCpf, setPassengerCpf] = useState('')
  const [passengerKind, setPassengerKind] = useState<PassengerKind>('Servidor')
  const [passengerStaffQuery, setPassengerStaffQuery] = useState('')
  const [staffOptions, setStaffOptions] = useState<AllowedStaffOption[]>([])
  const [selectedStaff, setSelectedStaff] = useState<AllowedStaffOption | null>(null)
  const [isStaffSearchLoading, setIsStaffSearchLoading] = useState(false)
  const [staffSearchError, setStaffSearchError] = useState<string | null>(null)
  const [isPassengerSaving, setIsPassengerSaving] = useState(false)
  const [passengerRemoveQuery, setPassengerRemoveQuery] = useState('')
  const [selectedPassengerToRemove, setSelectedPassengerToRemove] =
    useState<PassengerBoardItem | null>(null)
  const [isPassengerRemoving, setIsPassengerRemoving] = useState(false)
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
  const selectedBusPlate = selectedBus?.plate ?? trip?.busPlate ?? 'Sem onibus'
  const normalizedTripStatus = normalizeTripStatus(trip?.status)
  const isTripInProgress = normalizedTripStatus === 'EM ANDAMENTO'
  const isTripFinished = normalizedTripStatus.startsWith('CONCLUI')
  const isStartTripDisabled = isConfirmationLoading || isTripInProgress || isTripFinished
  const isFinishTripDisabled = isConfirmationLoading || isTripFinished
  const canReadQr = Boolean(trip?.isDriverAssociated)
  const isGuestPassenger = passengerKind === 'Convidado'
  const canSubmitLocalPassenger = Boolean(selectedStaff)
    && (!isGuestPassenger || (passengerName.trim().length > 0 && passengerCpf.trim().length === 11))
    && !isPassengerSaving
  const normalizedPassengerRemoveQuery = normalizeSearchText(passengerRemoveQuery)
  const removablePassengers = normalizedPassengerRemoveQuery
    ? boardedPassengers.filter((passenger) =>
        normalizeSearchText(passenger.name).includes(normalizedPassengerRemoveQuery),
      )
    : boardedPassengers
  const selectedPassengerIdentifier =
    selectedPassengerToRemove?.reservationId ?? selectedPassengerToRemove?.localPassengerId
  const canSubmitRemovePassenger = Boolean(selectedPassengerIdentifier) && !isPassengerRemoving
  const qrAccessMessage = !trip?.isDriverAssociated
    ? 'Associe-se a esta viagem antes de ler QR Code.'
    : null
  const whatsappAlertUrl = `https://wa.me/557599744054?text=${encodeURIComponent(
    `Estou com problema no onibus ${selectedBusPlate} na viagem de ${trip?.origin ?? 'Origem'} para ${trip?.destiny ?? 'Destino'}`,
  )}`
  const whatsappRequestUrl = `https://wa.me/557599744054?text=${encodeURIComponent(
    `Solicito novo onibus para a viagem de ${trip?.origin ?? 'Origem'} para ${trip?.destiny ?? 'Destino'}`,
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
    if (!isPassengerMenuOpen) {
      return
    }

    const query = passengerStaffQuery.trim()
    if (query.length < 2) {
      setStaffOptions([])
      setStaffSearchError(null)
      setIsStaffSearchLoading(false)
      return
    }

    let isMounted = true
    setIsStaffSearchLoading(true)
    setStaffSearchError(null)

    const timeoutId = window.setTimeout(() => {
      searchAllowedStaff(query)
        .then((staff) => {
          if (!isMounted) {
            return
          }

          setStaffOptions(staff)
          if (selectedStaff && !staff.some((option) => option.id === selectedStaff.id)) {
            setSelectedStaff(null)
          }
        })
        .catch((error) => {
          console.warn('Nao foi possivel buscar servidores:', error)
          if (isMounted) {
            setStaffOptions([])
            setStaffSearchError('Nao foi possivel buscar servidores.')
          }
        })
        .finally(() => {
          if (isMounted) {
            setIsStaffSearchLoading(false)
          }
        })
    }, 250)

    return () => {
      isMounted = false
      window.clearTimeout(timeoutId)
    }
  }, [isPassengerMenuOpen, passengerStaffQuery, selectedStaff])

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
    setPassengerName('')
    setPassengerCpf('')
    setPassengerKind('Servidor')
    setPassengerStaffQuery('')
    setStaffOptions([])
    setSelectedStaff(null)
    setStaffSearchError(null)
    setIsPassengerMenuOpen(true)
  }

  const handleOpenRemovePassenger = () => {
    setPassengerRemoveQuery('')
    setSelectedPassengerToRemove(null)
    setActionError(null)
    setIsRemovePassengerMenuOpen(true)
  }

  const handleRegisterPassenger = async () => {
    if (!trip || !selectedStaff || !canSubmitLocalPassenger) {
      return
    }

    setIsPassengerSaving(true)
    setActionError(null)

    try {
      const response = await registerLocalTripPassenger({
        trip: trip.id,
        passenger_type: isGuestPassenger ? 'LOCAL_GUEST' : 'LOCAL_SERVER',
        allowed_staff_id: !isGuestPassenger ? selectedStaff.id : undefined,
        associated_staff_id: isGuestPassenger ? selectedStaff.id : undefined,
        full_name: isGuestPassenger ? passengerName.trim() : undefined,
        cpf: isGuestPassenger ? passengerCpf.trim() : undefined,
      })
      const refreshedTrip = await getTripFromApi(trip.id)
      const evictedNames =
        response.evicted_passengers?.map((passenger) => passenger.name).join(', ')
      const registeredName =
        response.passenger?.name
        ?? (isGuestPassenger ? passengerName.trim() : selectedStaff.name)

      setTrip({
        ...refreshedTrip,
        isDriverAssociated: trip.isDriverAssociated,
      })
      setPassengerName('')
      setPassengerCpf('')
      setPassengerKind('Servidor')
      setPassengerStaffQuery('')
      setStaffOptions([])
      setSelectedStaff(null)
      setStaffSearchError(null)
      setIsPassengerMenuOpen(false)
      setQrFeedback({
        kind: evictedNames ? 'info' : 'success',
        message: evictedNames
          ? `${registeredName} cadastrado. Retire do onibus: ${evictedNames}.`
          : `${registeredName} cadastrado no embarque.`,
      })
    } catch (error) {
      console.warn('Nao foi possivel cadastrar passageiro local:', error)
      setActionError(getApiErrorMessage(error, 'Nao foi possivel cadastrar passageiro.'))
    } finally {
      setIsPassengerSaving(false)
    }
  }

  const handleRemovePassenger = async () => {
    if (!trip || !selectedPassengerToRemove || !canSubmitRemovePassenger) {
      return
    }

    setIsPassengerRemoving(true)
    setActionError(null)

    try {
      const response = await removeTripPassenger({
        trip: trip.id,
        reservation_id: selectedPassengerToRemove.reservationId,
        local_passenger_id: selectedPassengerToRemove.localPassengerId,
      })
      const refreshedTrip = await getTripFromApi(trip.id)
      const removedName = response.removed_passenger?.name ?? selectedPassengerToRemove.name

      setTrip({
        ...refreshedTrip,
        isDriverAssociated: trip.isDriverAssociated,
      })
      setPassengerRemoveQuery('')
      setSelectedPassengerToRemove(null)
      setIsRemovePassengerMenuOpen(false)
      setQrFeedback({
        kind: 'success',
        message: `${removedName} removido do embarque.`,
      })
    } catch (error) {
      console.warn('Nao foi possivel remover passageiro:', error)
      setActionError(getApiErrorMessage(error, 'Nao foi possivel remover passageiro.'))
    } finally {
      setIsPassengerRemoving(false)
    }
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
      if (isTripInProgress) {
        window.location.href = '/app/driver/viagens'
        return
      }

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
        const evictedNames =
          response.evicted_passengers?.map((passenger) => passenger.name).join(', ')

        if (evictedNames) {
          const refreshedTrip = await getTripFromApi(trip.id)
          setTrip({
            ...refreshedTrip,
            isDriverAssociated: trip.isDriverAssociated,
          })
        } else {
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
        }
        setQrFeedback({
          kind: evictedNames ? 'info' : 'success',
          message: evictedNames
            ? `Check-in realizado para ${passengerName}. Retire do onibus: ${evictedNames}.`
            : response.status ?? `Check-in realizado para ${passengerName}.`,
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
    void handleRegisterPassenger()
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
      ? isTripInProgress
        ? 'A viagem em andamento continuara vinculada a voce para retomada pela lista.'
        : 'Se o motorista voltar, ele sera desassociado da viagem.'
      : confirmation === 'start'
        ? 'Deseja iniciar esta viagem? Esta acao marcara a viagem como em andamento.'
        : confirmation === 'finish'
          ? 'Deseja finalizar esta viagem? Esta acao marcara a viagem como concluida.'
          : 'Ja existem 2 onibus associados a essa viagem, deseja solicitar mais?'

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
            <Button
              asChild
              className="rounded-lg border-red-600 bg-red-600 font-bold text-white hover:bg-red-700"
            >
              <a
                href={whatsappAlertUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Reportar problema pelo WhatsApp"
              >
                <WarningCircleIcon aria-hidden="true" weight="bold" />
                Reportar Problema
              </a>
            </Button>
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
                  {embarkedCount}/{activeCapacity} check-ins confirmados
                </strong>
              </div>

              <div className="mt-6 grid w-full max-w-md gap-3">
                <Button
                  type="button"
                  className="min-h-12 rounded-lg font-bold"
                  onClick={handleAddPassenger}
                >
                  <UserPlusIcon aria-hidden="true" weight="bold" />
                  Add passageiro
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-12 rounded-lg font-bold"
                  onClick={handleOpenRemovePassenger}
                  disabled={boardedPassengers.length === 0 || isPassengerRemoving}
                >
                  <UserMinusIcon aria-hidden="true" weight="bold" />
                  Remover passageiro
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
                    embarques
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
                  Busque o servidor autorizado e registre o embarque local.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-2">
                <Label htmlFor="driver-passenger-kind">Tipo</Label>
                <NativeSelect
                  id="driver-passenger-kind"
                  value={passengerKind}
                  onChange={(event) => {
                    setPassengerKind(event.target.value as PassengerKind)
                    setPassengerName('')
                    setPassengerCpf('')
                  }}
                  className="w-full"
                >
                  <NativeSelectOption value="Servidor">Servidor</NativeSelectOption>
                  <NativeSelectOption value="Convidado">Convidado</NativeSelectOption>
                </NativeSelect>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="driver-passenger-staff-search">
                  {isGuestPassenger ? 'Servidor associado' : 'Servidor'}
                </Label>
                <Input
                  id="driver-passenger-staff-search"
                  type="text"
                  value={passengerStaffQuery}
                  onChange={(event) => {
                    setPassengerStaffQuery(event.target.value)
                    setSelectedStaff(null)
                  }}
                  placeholder="Digite nome ou matricula"
                  autoFocus
                  required
                />
                {isStaffSearchLoading ? (
                  <p className="text-xs font-semibold text-muted-foreground">
                    Buscando servidores...
                  </p>
                ) : null}
                {staffSearchError ? (
                  <p className="text-xs font-semibold text-red-700">
                    {staffSearchError}
                  </p>
                ) : null}
                {staffOptions.length > 0 ? (
                  <div
                    role="listbox"
                    aria-label="Servidores encontrados"
                    className="max-h-44 overflow-y-auto rounded-lg border border-border bg-background p-1"
                  >
                    {staffOptions.map((staff) => {
                      const isSelected = selectedStaff?.id === staff.id

                      return (
                        <button
                          key={staff.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          className={cn(
                            'flex w-full min-w-0 flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left transition-colors',
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-muted focus-visible:bg-muted focus-visible:outline-none',
                          )}
                          onClick={() => setSelectedStaff(staff)}
                        >
                          <span className="w-full truncate text-sm font-bold">
                            {staff.name}
                          </span>
                          <span
                            className={cn(
                              'text-xs font-semibold',
                              isSelected
                                ? 'text-primary-foreground/80'
                                : 'text-muted-foreground',
                            )}
                          >
                            Matricula {staff.registration_number}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                ) : null}
                {!isStaffSearchLoading
                  && passengerStaffQuery.trim().length >= 2
                  && staffOptions.length === 0
                  && !staffSearchError ? (
                    <p className="text-xs font-semibold text-muted-foreground">
                      Nenhum servidor encontrado.
                    </p>
                  ) : null}
                {selectedStaff ? (
                  <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground">
                    {selectedStaff.name} - matricula {selectedStaff.registration_number}
                  </p>
                ) : null}
              </div>
              {isGuestPassenger ? (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="driver-passenger-name">Nome do convidado</Label>
                    <Input
                      id="driver-passenger-name"
                      type="text"
                      value={passengerName}
                      onChange={(event) => setPassengerName(event.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="driver-passenger-cpf">CPF do convidado</Label>
                    <Input
                      id="driver-passenger-cpf"
                      type="text"
                      inputMode="numeric"
                      maxLength={11}
                      value={passengerCpf}
                      onChange={(event) => {
                        setPassengerCpf(event.target.value.replace(/\D/g, ''))
                      }}
                      required
                    />
                  </div>
                </>
              ) : null}
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
                  onClick={() => {
                    setIsPassengerMenuOpen(false)
                    setActionError(null)
                  }}
                  disabled={isPassengerSaving}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="rounded-lg"
                  disabled={!canSubmitLocalPassenger}
                >
                  {isPassengerSaving ? 'Cadastrando...' : 'Cadastrar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isRemovePassengerMenuOpen}
          onOpenChange={(isOpen) => {
            setIsRemovePassengerMenuOpen(isOpen)
            if (!isOpen) {
              setPassengerRemoveQuery('')
              setSelectedPassengerToRemove(null)
              setActionError(null)
            }
          }}
        >
          <DialogContent className="rounded-lg sm:max-w-md">
            <form
              className="grid gap-5"
              onSubmit={(event) => {
                event.preventDefault()
                void handleRemovePassenger()
              }}
            >
              <DialogHeader className="items-center text-center">
                <UserMinusIcon aria-hidden="true" weight="fill" className="size-8 text-primary" />
                <DialogTitle>Remover passageiro</DialogTitle>
                <DialogDescription>
                  Pesquise pelo nome na lista de passageiros embarcados.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-2">
                <Label htmlFor="driver-passenger-remove-search">
                  Pesquisar nome
                </Label>
                <Input
                  id="driver-passenger-remove-search"
                  type="text"
                  value={passengerRemoveQuery}
                  onChange={(event) => {
                    setPassengerRemoveQuery(event.target.value)
                    setSelectedPassengerToRemove(null)
                  }}
                  placeholder="Digite o nome"
                  autoFocus
                />
              </div>
              {boardedPassengers.length === 0 ? (
                <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm font-semibold text-muted-foreground">
                  Nenhum passageiro embarcado.
                </p>
              ) : removablePassengers.length > 0 ? (
                <div
                  role="listbox"
                  aria-label="Passageiros embarcados"
                  className="max-h-56 overflow-y-auto rounded-lg border border-border bg-background p-1"
                >
                  {removablePassengers.map((passenger) => {
                    const isSelected =
                      selectedPassengerToRemove?.reservationId === passenger.reservationId
                      && selectedPassengerToRemove?.localPassengerId === passenger.localPassengerId
                      && selectedPassengerToRemove?.name === passenger.name
                    const hasIdentifier = Boolean(passenger.reservationId ?? passenger.localPassengerId)
                    const passengerMeta = passenger.kind
                      ? `${passenger.source} - ${passenger.kind}`
                      : passenger.source

                    return (
                      <button
                        key={`${passenger.source}-${passenger.reservationId ?? passenger.localPassengerId ?? passenger.id}-${passenger.name}`}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        disabled={!hasIdentifier || isPassengerRemoving}
                        className={cn(
                          'flex w-full min-w-0 flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted focus-visible:bg-muted focus-visible:outline-none',
                        )}
                        onClick={() => setSelectedPassengerToRemove(passenger)}
                      >
                        <span className="w-full truncate text-sm font-bold">
                          {passenger.name}
                        </span>
                        <span
                          className={cn(
                            'text-xs font-semibold',
                            isSelected
                              ? 'text-primary-foreground/80'
                              : 'text-muted-foreground',
                          )}
                        >
                          {hasIdentifier
                            ? passengerMeta
                            : 'Identificador indisponivel'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm font-semibold text-muted-foreground">
                  Nenhum passageiro encontrado.
                </p>
              )}
              {selectedPassengerToRemove ? (
                <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground">
                  {selectedPassengerToRemove.name} selecionado para remocao.
                </p>
              ) : null}
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
                  onClick={() => {
                    setIsRemovePassengerMenuOpen(false)
                    setPassengerRemoveQuery('')
                    setSelectedPassengerToRemove(null)
                    setActionError(null)
                  }}
                  disabled={isPassengerRemoving}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="rounded-lg"
                  disabled={!canSubmitRemovePassenger}
                >
                  {isPassengerRemoving ? 'Removendo...' : 'Remover'}
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
