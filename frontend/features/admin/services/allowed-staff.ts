import { apiFetch } from '@lib/api'

export interface AllowedStaff {
  id: string
  name: string
  registration_number: string
  has_account: boolean
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface AllowedStaffParams {
  q?: string
  page?: number
  has_account?: boolean
}

export function fetchAllowedStaff(params: AllowedStaffParams = {}) {
  const search = new URLSearchParams()
  if (params.q) search.set('q', params.q)
  if (params.page && params.page > 1) search.set('page', String(params.page))
  if (params.has_account !== undefined) search.set('has_account', String(params.has_account))
  const query = search.size ? `?${search.toString()}` : ''
  return apiFetch<PaginatedResponse<AllowedStaff>>(`/staff/${query}`)
}
