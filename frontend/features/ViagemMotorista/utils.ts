import { normalizeTripTime } from '@features/trips/utils/time'
import type {
  ApiList,
  BusModel,
  DriverBusOption,
  PassengerBoardItem,
  TripModel,
} from './types'

export function toList<T>(payload: ApiList<T>): T[] {
  return Array.isArray(payload) ? payload : payload.results ?? []
}

export function normalizeTripStatus(status?: string | null) {
  return (status ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
}

export function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

export function normalizeCapacity(capacity?: number | null) {
  return typeof capacity === 'number' && capacity > 0 ? capacity : 46
}

export function createPassengerPlaceholders(totalPassengers?: number | null): PassengerBoardItem[] {
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

export function normalizeCheckedInPassengers(trip: TripModel, capacity: number): PassengerBoardItem[] {
  const checkedInPassengers = trip.checked_in_passengers

  if (Array.isArray(checkedInPassengers)) {
    return checkedInPassengers
      .filter((passenger) => passenger.check_in === true || passenger.checkin === true)
      .slice(0, capacity)
      .map((passenger, index) => {
        const fallbackId = index + 1
        const reservationId =
          typeof passenger.reservation_id === 'string' ? passenger.reservation_id : undefined
        const localPassengerId =
          typeof passenger.local_passenger_id === 'string'
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

export function normalizeTripDetail(trip: TripModel) {
  const capacity = normalizeCapacity(trip.seating_capacity)
  const driverId = typeof trip.driver === 'string' ? trip.driver : null

  return {
    id: trip.id,
    origin: trip.origin ?? 'Origem',
    destiny: trip.destiny ?? 'Destino',
    departureDate: trip.departure_timestamp
      ? new Date(trip.departure_timestamp).toLocaleDateString('pt-BR')
      : trip.departure_time?.split(',')[0]?.trim() ?? '—',
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
    checkinStarted: trip.checkin_started ?? null,
    passengers: normalizeCheckedInPassengers(trip, capacity),
  }
}

export function normalizeBusOption(bus: BusModel): DriverBusOption | null {
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

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { error?: string; detail?: string } | null }).data

    return data?.error ?? data?.detail ?? fallback
  }

  return fallback
}
