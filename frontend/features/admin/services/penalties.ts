import { apiFetch } from '@lib/api'

export interface Penalty {
  id: string
  student_name: string
  student_id_display: string
  description: string
  is_active: boolean
  trip_date: string
  route: string
  departure_time: string
  reservation_id: string
  created_at: string
}

export interface PenaltyFilters {
  q?: string
  is_active?: string
  date_from?: string
  date_to?: string
}

export interface PunishmentGroup {
  trip_id: string
  trip_date: string
  departure_time: string
  route: string
  punishment_count: number
  punishments: Penalty[]
}

export function fetchPenalties(filters: PenaltyFilters = {}) {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.is_active) params.set('is_active', filters.is_active)
  if (filters.date_from) params.set('date_from', filters.date_from)
  if (filters.date_to) params.set('date_to', filters.date_to)
  const qs = params.toString()
  return apiFetch<Penalty[]>(`/reservations/punishments/manage/${qs ? `?${qs}` : ''}`)
}

export function fetchPenaltiesGrouped(filters: PenaltyFilters = {}) {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.is_active) params.set('is_active', filters.is_active)
  if (filters.date_from) params.set('date_from', filters.date_from)
  if (filters.date_to) params.set('date_to', filters.date_to)
  const qs = params.toString()
  return apiFetch<PunishmentGroup[]>(`/reservations/punishments/grouped-by-trip/${qs ? `?${qs}` : ''}`)
}

export function updatePenalty(id: string, data: { is_active: boolean }) {
  return apiFetch<Penalty>(`/reservations/punishments/manage/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function deletePenalty(id: string) {
  return apiFetch<void>(`/reservations/punishments/manage/${id}/`, { method: 'DELETE' })
}
