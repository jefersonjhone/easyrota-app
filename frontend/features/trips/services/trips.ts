import { apiFetch } from '@lib/api'
import type { CurrentTripDetail, Trip, TripPassengerCheckInResponse } from '../types'

export function fetchTrips() {
  return apiFetch<Trip[]>('/trips/')
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
