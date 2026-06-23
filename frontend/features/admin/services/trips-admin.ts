import { apiFetch } from '@lib/api'

export type TripPassengerEntry = {
  id: number
  passenger_name: string
  passenger_type: 'ESTUDANTE' | 'SERVIDOR' | 'CONVIDADO' | 'SERVIDOR LOCAL' | 'CONVIDADO LOCAL'
  passenger_id_display: string | null
  profile_id: number | null
  reservation_status: string | null
  check_in: boolean | null
  checkin_date: string | null
}

export type TripAdminDetail = {
  id: number
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
  driver_id: number | null
  bus_plate: string | null
  bus_brand: string | null
  bus_capacity: number | null
  bus_id: number | null
  seating_capacity: number
  active_reservations: number
  checked_in_count: number
  passengers: TripPassengerEntry[]
}

export function fetchTripAdminDetail(id: number) {
  return apiFetch<TripAdminDetail>(`/trips/${id}/admin_detail/`)
}
