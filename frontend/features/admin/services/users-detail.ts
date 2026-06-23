import { apiFetch } from '@lib/api'

interface UserInfo {
  id: string
  full_name: string
  email: string
  profile_type: 'STUDENT' | 'CIVIL-SERVANT'
  is_active: boolean
  date_joined: string
}

interface ProfileInfo {
  student_id: string | null
  civil_servant_id: string | null
}

interface Stats {
  total_trips: number
  total_reservations: number
  total_absences: number
  attendance_rate: number
}

interface TripEntry {
  id: number
  date: string
  route: string
  departure_time: string
  arrival_time: string
  status: string
  checked_in: boolean
  reservation_status: string
}

export interface GuestEntry {
  id: string
  full_name: string
  cpf: string
  trip_date: string
  route: string
}

export interface UserDetail {
  user: UserInfo
  profile: ProfileInfo
  stats: Stats
  trips: TripEntry[]
  guests: GuestEntry[]
  guest_count: number
}

export function fetchUserDetail(profileType: 'STUDENT' | 'CIVIL-SERVANT', profileId: string) {
  const endpoint = profileType === 'STUDENT' ? `/students/${profileId}/detail/` : `/civil-servants/${profileId}/detail/`
  return apiFetch<UserDetail>(endpoint)
}
