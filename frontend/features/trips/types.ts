export type TripStatus =
  | 'CONFIRMADA'
  | 'EM ANDAMENTO'
  | 'CONCLUÍDA'
  | 'CANCELADA'
  | 'RISCO DE CANCELAMENTO'

export type Trip = {
  id: string
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
  bus: string | null
  route: string
}

export type TripCheckedInPassenger = {
  reservation_id?: string
  local_passenger_id?: string
  passenger_name: string
  check_in: boolean
  checkin_date: string | null
  source?: 'QR' | 'Manual'
  kind?: 'Servidor' | 'Convidado'
}

export type CurrentTripDetail = {
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

export type TripPassengerCheckInResponse = {
  status?: string
  error?: string
  reservation_id?: string
  passenger_name?: string
  checkin_date?: string
  evicted_passenger?: {
    name: string
    reservation_id: string
  }
  evicted_passengers?: Array<{
    name: string
    reservation_id: string
  }>
}

export type AllowedStaffOption = {
  id: string
  name: string
  registration_number: string
}

export type LocalTripPassengerPayload = {
  trip: string
  passenger_type: 'LOCAL_SERVER' | 'LOCAL_GUEST'
  allowed_staff_id?: string
  associated_staff_id?: string
  full_name?: string
  cpf?: string
}

export type RemoveTripPassengerPayload = {
  trip: string
  reservation_id?: string
  local_passenger_id?: string
}

export type LocalTripPassengerResponse = {
  passenger?: {
    id?: string
    reservation_id?: string
    passenger_type?: string
    name?: string
  }
  associated_server?: {
    id?: string
    reservation_id?: string
    passenger_type?: string
    name?: string
  }
  evicted_passenger?: {
    name: string
    reservation_id: string
  }
  evicted_passengers?: Array<{
    name: string
    reservation_id: string
  }>
  checked_in_count?: number
}

export type RemoveTripPassengerResponse = {
  removed_passenger: {
    name: string
    reservation_id?: string
    local_passenger_id?: string
  }
  checked_in_count: number
}
