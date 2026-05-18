import { apiFetch } from '@lib/api'

import type {
  CurrentTripData,
  ReservationHistoryItem,
} from '../types'

export function fetchCurrentTrip() {
  return apiFetch<CurrentTripData>('/trips/current/')
}

export function fetchReservationHistory() {
  return apiFetch<ReservationHistoryItem[]>('/reservations/history/')
}
