import { apiFetch } from '@lib/api'
import type { TripStatus } from '@/features/trips/types'

export type RecentTripEntry = {
  id: string
  trip_date: string
  departure_time: string
  origin: string
  destiny: string
  status: TripStatus
}

export type BusAdminDetail = {
  id: string
  number_plate: string
  brand: string
  seating_capacity: number
  status: 'ATIVO' | 'MANUTENÇÃO'
  trip_count: number
  recent_trips: RecentTripEntry[]
}

export function fetchBusAdminDetail(id: string) {
  return apiFetch<BusAdminDetail>(`/buses/${id}/admin_detail/`)
}
