import { apiFetch } from '@lib/api'

export type Bus = {
  id: string
  number_plate: string
  seating_capacity: number
  brand: string
}

export type Driver = {
  id: string
  full_name: string
  cnh: string
  email: string
}

export function fetchBuses() {
  return apiFetch<Bus[]>('/buses/')
}

export function fetchDrivers() {
  return apiFetch<Driver[]>('/drivers/')
}

export function adminAssignDriver(tripId: string, driverId: string) {
  return apiFetch<{ status: string }>(`/trips/${tripId}/admin_assign_driver/`, {
    method: 'POST',
    body: JSON.stringify({ driver_id: driverId }),
  })
}

export function adminUnassignDriver(tripId: string) {
  return apiFetch<{ status: string }>(`/trips/${tripId}/admin_unassign_driver/`, {
    method: 'POST',
  })
}

export function adminAssignBus(tripId: string, busId: string) {
  return apiFetch<{ status: string }>(`/trips/${tripId}/admin_assign_bus/`, {
    method: 'POST',
    body: JSON.stringify({ bus_id: busId }),
  })
}

export function adminUnassignBus(tripId: string) {
  return apiFetch<{ status: string }>(`/trips/${tripId}/admin_unassign_bus/`, {
    method: 'POST',
  })
}
