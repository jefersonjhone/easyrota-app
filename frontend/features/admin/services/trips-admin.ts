import { apiFetch } from '@lib/api'

export type TripPassengerEntry = {
  id: number
  passenger_name: string
  passenger_type: 'ESTUDANTE' | 'SERVIDOR' | 'CONVIDADO' | 'SERVIDOR LOCAL' | 'CONVIDADO LOCAL'
  passenger_id_display: string | null
  profile_id: string | null
  reservation_status: string | null
  check_in: boolean | null
  checkin_date: string | null
}

export type TripAdminDetail = {
  id: string
  trip_date: string
  status: string
  origin: string
  destiny: string
  departure_time: string
  arrival_time: string
  trip_departure_time: string | null
  trip_arrival_time: string | null
  driver_name: string | null
  driver_cnh: string | null
  driver_id: string | null
  bus_plate: string | null
  bus_brand: string | null
  bus_capacity: number | null
  bus_id: string | null
  seating_capacity: number
  active_reservations: number
  checked_in_count: number
  passengers: TripPassengerEntry[]
}

export function fetchTripAdminDetail(id: string) {
  return apiFetch<TripAdminDetail>(`/trips/${id}/admin_detail/`)
}
