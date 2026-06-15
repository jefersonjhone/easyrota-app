export type PassengerBoardItem = {
  id: number
  name: string
  source: 'QR' | 'Manual'
  kind?: PassengerKind
  identifier?: string
  reservationId?: number
  localPassengerId?: number
}

export type PassengerKind = 'Servidor' | 'Convidado'

export type DriverTripDetail = {
  id: string
  origin: string
  destiny: string
  departureTime: string
  busPlate: string
  busId: number | null
  driverId: number | null
  isDriverAssociated: boolean
  capacity: number
  associatedBuses: number
  passengers: PassengerBoardItem[]
  status: string
}

export type ApiList<T> = T[] | { results?: T[] }

export type TripModel = {
  id: number
  origin?: string | null
  destiny?: string | null
  departure_timestamp?: string | null
  departure_time?: string | null
  active_reservations?: number | null
  checked_in_count?: number | null
  checked_in_passengers?: TripCheckedInPassenger[] | null
  seating_capacity?: number | null
  bus?: number | null
  driver?: number | null
  bus_number_plate?: string | null
  status?: string | null
}

export type TripCheckedInPassenger = {
  reservation_id?: number | null
  local_passenger_id?: number | null
  passenger_name?: string | null
  check_in?: boolean | null
  checkin?: boolean | null
  checkin_date?: string | null
  source?: 'QR' | 'Manual' | null
  kind?: PassengerKind | null
}

export type BusModel = {
  id: number
  number_plate?: string
  plate?: string
  bus_number_plate?: string
  seating_capacity?: number
  capacity?: number
}

export type DriverBusOption = {
  id: number
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
