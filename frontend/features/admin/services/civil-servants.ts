import { apiFetch } from '@lib/api'

export interface CivilServant {
  id: string
  user_id: string
  full_name: string
  email: string
  civil_servant_id: string
}

export interface CreateCivilServantPayload {
  full_name: string
  email: string
  password: string
  civil_servant_id: string
  passwordConfirmation: string
}

export interface UpdateCivilServantPayload {
  full_name?: string
  email?: string
  password?: string
  civil_servant_id?: string
  passwordConfirmation?: string
}

export function fetchCivilServants(q?: string) {
  const query = q ? `?q=${encodeURIComponent(q)}` : ''
  return apiFetch<CivilServant[]>(`/civil-servants/${query}`)
}

export function createCivilServant(data: CreateCivilServantPayload) {
  return apiFetch<CivilServant>('/civil-servants/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateCivilServant(id: string, data: UpdateCivilServantPayload) {
  return apiFetch<CivilServant>(`/civil-servants/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteCivilServant(id: string) {
  return apiFetch<void>(`/civil-servants/${id}/`, { method: 'DELETE' })
}
