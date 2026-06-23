import { apiFetch } from '@lib/api'

export type Bus = {
  id: number
  number_plate: string
  seating_capacity: number
  brand: string
}

export type Driver = {
  id: number
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

export function adminAssignDriver(tripId: number, driverId: number) {
  return apiFetch<{ status: string }>(`/trips/${tripId}/admin_assign_driver/`, {
    method: 'POST',
    body: JSON.stringify({ driver_id: driverId }),
  })
}

export function adminUnassignDriver(tripId: number) {
  return apiFetch<{ status: string }>(`/trips/${tripId}/admin_unassign_driver/`, {
    method: 'POST',
  })
}

export function adminAssignBus(tripId: number, busId: number) {
  return apiFetch<{ status: string }>(`/trips/${tripId}/admin_assign_bus/`, {
    method: 'POST',
    body: JSON.stringify({ bus_id: busId }),
  })
}

export function adminUnassignBus(tripId: number) {
  return apiFetch<{ status: string }>(`/trips/${tripId}/admin_unassign_bus/`, {
    method: 'POST',
  })
}
