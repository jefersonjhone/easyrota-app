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
} from '../types'

export function fetchTrips() {
  return apiFetch<Trip[]>('/trips/')
}

export function fetchTrip(id: string) {
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

export function updateTrip(id: string, data: Partial<Trip>) {
  return apiFetch<Trip>(`/trips/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function deleteTrip(id: string) {
  return apiFetch<void>(`/trips/${id}/`, { method: 'DELETE' })
}

export function bulkDeleteTrips(ids: string[]) {
  return apiFetch<{ deleted: number }>('/trips/bulk-delete/', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
}

export function checkInTripPassenger(tripId: string, passengerIdentifier: string) {
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
