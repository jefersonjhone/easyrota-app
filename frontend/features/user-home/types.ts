import type { AuthUser } from "@/features/auth/types/auth"

export type CurrentTripData = {
  id: string
  trip_date: string
  origin: string
  destiny: string
  departure_time: string
  arrival_time: string
  status_trip: string
  bus_number_plate: string
  driver: string
  percentage_complete: number
  minutes_remaining: number | null
  status_route: string
}

export type ReservationHistoryItem = {
  id: string
  origin: string
  destiny: string
  trip_date: string
  trip_history_status: string
  total_trips: number
  created_at: string
}

export type UserHomeDashboardData = {
  currentTrip: CurrentTripData | null
  reservationHistory: ReservationHistoryItem[]
}

export type Trip = {
  id: string
  trip_date: string
  trip_departure: string
  origin: string
  destiny: string
  trip_history_status: string
}
export type TripsHistory = Trip[]

export type ProfileUser = AuthUser & {
  student_id?: string
  civil_servant_id?: string
  joined_at: string
  checkins_count: number
  reservations_count: number
  active_reservations: number
  active_punishments : number
}

export interface Punishment {
  id: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export type PassengerGuest = {
  id: string
  full_name: string
  cpf: string
  passenger_identifier: string
}

export interface ActiveReservation {
  id: string
  origin: string
  destiny: string
  trip_date: string
  departure_time: string
  arrival_time: string
  status_trip: string
  bus_number_plate: string
  driver: string
  reservation_status: 'PENDENTE' | 'CONFIRMADA' | 'LISTA SECUNDÁRIA'
  kind: 'STUDENT' | 'CIVIL_SERVANT' | 'GUEST'
  trip_id: string
  trip_students_count: number
  trip_servants_count: number
  trip_guests_count: number
  available_seats: number
  can_cancel: boolean
  quorum_met: boolean
  percentage_complete: number
  minutes_remaining: number | null
  status_route: string
  passenger_identifier: string
  passenger_guests: PassengerGuest[]
  has_checked_in: boolean
  created_at: string
}

export interface AvailableTrip {
  id: string
  trip_date: string
  origin: string
  destiny: string
  departure_time: string
  bus_brand: string
  status_trip: string
  available_seats: number
  is_reservable: boolean
  quorum_met?: boolean
  reservation_deadline?: string
}
