import { apiFetch } from '@lib/api'
import type {
  AllowedStaffOption,
  CurrentTripDetail,
  LocalTripPassengerPayload,
  LocalTripPassengerResponse,
  RemoveTripPassengerPayload,
  RemoveTripPassengerResponse,
  Trip,
  TripPassengerCheckInResponse,
  TripStatus,
} from '../types'

export type TripDateOrder = 'recent' | 'distant'

export type TripFilters = {
  status?: TripStatus
  dateOrder?: TripDateOrder
}

export function fetchTrips(filters: TripFilters = {}) {
  const params = new URLSearchParams()

  if (filters.status) {
    params.set('status', filters.status)
  }

  if (filters.dateOrder) {
    params.set('date_order', filters.dateOrder)
  }

  const query = params.toString()

  return apiFetch<Trip[]>(`/trips/${query ? `?${query}` : ''}`)
}

export function fetchTrip(id: number) {
  return apiFetch<Trip>(`/trips/${id}/`)
}

export function fetchNextTrip() {
  return apiFetch<CurrentTripDetail>('/trips/current/')
}

export function createTrip(data: Partial<Trip>) {
  return apiFetch<Trip>('/trips/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateTrip(id: number, data: Partial<Trip>) {
  return apiFetch<Trip>(`/trips/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function deleteTrip(id: number) {
  return apiFetch<void>(`/trips/${id}/`, { method: 'DELETE' })
}

export function checkInTripPassenger(tripId: number | string, passengerIdentifier: string) {
  return apiFetch<TripPassengerCheckInResponse>(`/trips/${tripId}/check-in/`, {
    method: 'POST',
    body: JSON.stringify({ passenger_identifier: passengerIdentifier }),
  })
}

export function searchAllowedStaff(query: string) {
  return apiFetch<AllowedStaffOption[]>(
    `/staff/search/?q=${encodeURIComponent(query)}`,
  )
}

export function registerLocalTripPassenger(payload: LocalTripPassengerPayload) {
  return apiFetch<LocalTripPassengerResponse>('/staff/passengers/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function removeTripPassenger(payload: RemoveTripPassengerPayload) {
  return apiFetch<RemoveTripPassengerResponse>('/staff/passengers/', {
    method: 'DELETE',
    body: JSON.stringify(payload),
  })
}
