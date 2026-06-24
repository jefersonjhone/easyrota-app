import { apiFetch } from '@lib/api'
import type { ActiveReservation, AvailableTrip } from '../types'

export function fetchActiveReservations() {
  return apiFetch<ActiveReservation[]>('/reservations/active/')
}

export function fetchReservationById(id: string) {
  return apiFetch<ActiveReservation>(`/reservations/manage/${id}/`)
}

export function cancelReservation(id: string) {
  return apiFetch(`/reservations/manage/${id}/cancel/`, {
    method: 'POST',
  })
}

export function createReservation(tripId: string) {
  return apiFetch('/reservations/', {
    method: 'POST',
    body: JSON.stringify({ trip: tripId }),
  })
}

export function fetchTripById(id: string) {
  return apiFetch<AvailableTrip & { reservation_deadline: string }>(`/trips/${id}/`)
}
