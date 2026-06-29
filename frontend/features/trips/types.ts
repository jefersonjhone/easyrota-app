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
  is_current_driver?: boolean
  is_occupied_by_other_driver?: boolean
  bus: number | null
  route: number
  is_private?: boolean
  access_code?: string
}

export type TripCheckedInPassenger = {
  reservation_id?: number
  local_passenger_id?: number
  passenger_name: string
  check_in: boolean
  checkin_date: string | null
  source?: 'QR' | 'Manual'
  kind?: 'Servidor' | 'Convidado'
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
  evicted_passenger?: {
    name: string
    reservation_id: number
  }
  evicted_passengers?: Array<{
    name: string
    reservation_id: number
  }>
}

export type AllowedStaffOption = {
  id: number
  name: string
  registration_number: string
}

export type LocalTripPassengerPayload = {
  trip: number | string
  passenger_type: 'LOCAL_SERVER' | 'LOCAL_GUEST'
  allowed_staff_id?: number
  associated_staff_id?: number
  guest_without_server?: boolean
  full_name?: string
  cpf?: string
}

export type RemoveTripPassengerPayload = {
  trip: number | string
  reservation_id?: number
  local_passenger_id?: number
}

export type LocalTripPassengerResponse = {
  passenger?: {
    id?: number
    reservation_id?: number
    passenger_type?: string
    name?: string
  }
  associated_server?: {
    id?: number
    reservation_id?: number
    passenger_type?: string
    name?: string
  }
  evicted_passenger?: {
    name: string
    reservation_id: number
  }
  evicted_passengers?: Array<{
    name: string
    reservation_id: number
  }>
  checked_in_count?: number
}

export type RemoveTripPassengerResponse = {
  removed_passenger: {
    name: string
    reservation_id?: number
    local_passenger_id?: number
  }
  checked_in_count: number
}

export type TripRequestStatus = 'PENDENTE' | 'APROVADA' | 'RECUSADA'

export type TripRequest = {
  id: number
  requester: number
  requester_name: string
  origin_text: string
  destiny_text: string
  departure_date: string
  departure_time: string
  return_time: string | null
  reason: string
  status: TripRequestStatus
  feedback: string | null
  access_code: string | null
  created_at: string
}

export type CreateTripRequestPayload = {
  origin_text: string
  destiny_text: string
  departure_date: string
  departure_time: string
  return_time?: string
  reason: string
}

export type ApproveTripRequestPayload = {
  bus_id: number
  route_id: number
}

export type RejectTripRequestPayload = {
  feedback: string
}
