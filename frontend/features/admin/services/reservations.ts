import { apiFetch } from '@lib/api'

export interface Reservation {
  id: number
  passenger_name: string
  passenger_type: 'ESTUDANTE' | 'SERVIDOR' | 'CONVIDADO'
  passenger_id_display: string | null
  trip_id: number
  trip_date: string
  route: string
  departure_time: string
  trip_status: string
  status: string
  check_in: boolean
  created_at: string
}

export interface ReservationFilters {
  q?: string
  status?: string
  passenger_type?: string
  date_from?: string
  date_to?: string
}

export interface TripReservationGroup {
  trip_id: number
  trip_date: string
  departure_time: string
  route: string
  trip_status: string
  reservation_count: number
  reservations: Reservation[]
}

function buildParams(filters: ReservationFilters): string {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.passenger_type) params.set('passenger_type', filters.passenger_type)
  if (filters.date_from) params.set('date_from', filters.date_from)
  if (filters.date_to) params.set('date_to', filters.date_to)
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export function fetchReservations(filters: ReservationFilters = {}) {
  return apiFetch<Reservation[]>(`/reservations/manage/${buildParams(filters)}`)
}

export function fetchReservationsGrouped(filters: ReservationFilters = {}) {
  return apiFetch<TripReservationGroup[]>(`/reservations/grouped-by-trip/${buildParams(filters)}`)
}

export function updateReservation(id: number, data: Partial<Reservation>) {
  return apiFetch<Reservation>(`/reservations/manage/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function deleteReservation(id: number) {
  return apiFetch<void>(`/reservations/manage/${id}/`, { method: 'DELETE' })
}

export interface CreateReservationPayload {
  trip: number
  passenger_type: 'ESTUDANTE' | 'SERVIDOR' | 'CONVIDADO'
  profile_id?: number
  guest_name?: string
  guest_cpf?: string
}

export function createReservation(data: CreateReservationPayload) {
  return apiFetch<Reservation>('/reservations/manage/admin_create/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
