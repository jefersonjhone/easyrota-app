import { apiFetch } from '@lib/api'

export interface Admin {
  id: string
  user_id: string
  full_name: string
  email: string
  is_active: boolean
  role: string
  level: 'superadmin' | 'subadmin'
  created_by_name: string | null
  date_joined: string
}

export interface CreateAdminPayload {
  email: string
  full_name: string
  password: string
  role: string
}

export interface UpdateAdminPayload {
  full_name?: string
  email?: string
  password?: string
  role?: string
  level?: 'superadmin' | 'subadmin'
}

export function fetchAdmins(q?: string) {
  const query = q ? `?q=${encodeURIComponent(q)}` : ''
  return apiFetch<Admin[]>(`/admins/${query}`)
}

export function createAdmin(data: CreateAdminPayload) {
  return apiFetch<{ user: unknown; admin_profile: unknown }>('/admins/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateAdmin(userId: string, data: UpdateAdminPayload) {
  return apiFetch<Admin>(`/admins/${userId}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function deleteAdmin(userId: string) {
  return apiFetch<void>(`/admins/${userId}/`, { method: 'DELETE' })
}
