import { apiFetch } from '@lib/api'
import type { ApiList, BusModel, DriverBusOption, TripModel } from './types'
import { toList, normalizeTripDetail, normalizeBusOption } from './utils'

export async function getTripFromApi(tripId: string) {
  const trip = await apiFetch<TripModel>(`/trips/${tripId}/`)

  return normalizeTripDetail(trip)
}

export async function getBusesFromApi() {
  const payload = await apiFetch<ApiList<BusModel>>('/buses/')

  return toList(payload)
    .map(normalizeBusOption)
    .filter((bus): bus is DriverBusOption => Boolean(bus))
}

export async function assignDriverToTrip(tripId: string) {
  await apiFetch(`/trips/${tripId}/assign_driver/`, { method: 'POST' })
}

export async function unassignDriverFromTrip(tripId: string) {
  await apiFetch(`/trips/${tripId}/unassign_driver/`, { method: 'POST' })
}

export async function assignBusToTrip(tripId: string, busId: number) {
  await apiFetch(`/trips/${tripId}/assign_bus/`, {
    method: 'POST',
    body: JSON.stringify({ bus: busId }),
  })
}

export async function unassignBusFromTrip(tripId: string) {
  await apiFetch(`/trips/${tripId}/unassign_bus/`, { method: 'POST' })
}

export async function startTrip(tripId: string) {
  await apiFetch(`/trips/${tripId}/start_trip/`, { method: 'POST' })
}

export async function finishTrip(tripId: string) {
  await apiFetch(`/trips/${tripId}/finish_trip/`, { method: 'POST' })
}
