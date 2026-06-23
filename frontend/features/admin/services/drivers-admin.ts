import { apiFetch } from '@lib/api'
import type { RecentTripEntry } from './buses-admin'

export type DriverAdminDetail = {
  id: number
  user_id: string
  full_name: string
  email: string
  cnh: string
  is_active: boolean
  date_joined: string
  trip_count: number
  recent_trips: RecentTripEntry[]
}

export function fetchDriverAdminDetail(id: number) {
  return apiFetch<DriverAdminDetail>(`/drivers/${id}/admin_detail/`)
}
