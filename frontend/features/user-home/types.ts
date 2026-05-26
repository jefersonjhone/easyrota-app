import type { AuthUser } from "@/features/auth/types/auth"


export type CurrentTripData = {
  id: number
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
  id: number
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
  student_id?: number
  civil_servant_id?: number
  joined_at: string
  checkins_count: number
  reservations_count: number
  active_reservations: number
}