export type PassengerBoardItem = {
  id: string
  name: string
  source: 'QR' | 'Manual'
  kind?: PassengerKind
  identifier?: string
  reservationId?: string
  localPassengerId?: string
}

export type PassengerKind = 'Servidor' | 'Convidado'

export type DriverTripDetail = {
  id: string
  origin: string
  destiny: string
  departureDate: string
  departureTime: string
  departureTimestamp: string | null
  arrivalTimestamp: string | null
  expectedDeparture: string | null
  expectedArrival: string | null
  busPlate: string
  busId: string | null
  driverId: string | null
  isDriverAssociated: boolean
  capacity: number
  associatedBuses: number
  passengers: PassengerBoardItem[]
  status: string
  checkinStarted: string | null
  activeReservations: number
}

export type ApiList<T> = T[] | { results?: T[] }

export type TripModel = {
  id: string
  origin?: string | null
  destiny?: string | null
  trip_date?: string | null
  departure_timestamp?: string | null
  arrival_timestamp?: string | null
  expected_departure?: string | null
  expected_arrival?: string | null
  departure_time?: string | null
  active_reservations?: number | null
  checked_in_count?: number | null
  checked_in_passengers?: TripCheckedInPassenger[] | null
  seating_capacity?: number | null
  bus?: string | null
  driver?: string | null
  bus_number_plate?: string | null
  status?: string | null
  checkin_started?: string | null
}

export type TripCheckedInPassenger = {
  reservation_id?: string | null
  local_passenger_id?: string | null
  passenger_name?: string | null
  check_in?: boolean | null
  checkin?: boolean | null
  checkin_date?: string | null
  source?: 'QR' | 'Manual' | null
  kind?: PassengerKind | null
}

export type BusModel = {
  id: string
  number_plate?: string
  plate?: string
  bus_number_plate?: string
  seating_capacity?: number
  capacity?: number
}

export type DriverBusOption = {
  id: string
  plate: string
  capacity: number | null
}

export type ViagemMotoristaProps = {
  tripId?: string
}

export type QrFeedback = {
  kind: 'success' | 'error' | 'info'
  message: string
}

export type ReservationItem = {
  id: string
  passenger_name: string
  kind: 'Aluno' | 'Servidor' | 'Convidado' | null
  status: string
  check_in: boolean
  checkin_date: string | null
  created_at: string
}
