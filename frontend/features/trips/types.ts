export type TripStatus =
  | 'CONFIRMADA'
  | 'EM ANDAMENTO'
  | 'CONCLUÍDA'
  | 'CANCELADA'
  | 'RISCO DE CANCELAMENTO'

export type Trip = {
  id: number
  origin: string
  destiny: string
  departure_time: string
  arrival_time: string
  active_reservations: number
  checked_in_count: number
  checked_in_passengers: TripCheckedInPassenger[]
  seating_capacity: number
  trip_date: string
  status: TripStatus
  departure_timestamp: string | null
  arrival_timestamp: string | null
  bus: number | null
  route: number
}

export type TripCheckedInPassenger = {
  reservation_id: number
  passenger_name: string
  check_in: boolean
  checkin_date: string | null
}

export type CurrentTripDetail = {
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

export type TripPassengerCheckInResponse = {
  status?: string
  error?: string
  reservation_id?: number
  passenger_name?: string
  checkin_date?: string
}
