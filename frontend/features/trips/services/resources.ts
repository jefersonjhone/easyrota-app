import { apiFetch } from '@lib/api'

export type Bus = {
  id: number
  number_plate: string
  seating_capacity: number
  brand: string
  driver: number | null
  administrator: number | null
}

export type Route = {
  id: number
  origin: string
  destiny: string
  departure_time: string
  arrival_time: string
  administrator: number | null
}

export function fetchBuses() {
  return apiFetch<Bus[]>('/buses/')
}

export function fetchRoutes() {
  return apiFetch<Route[]>('/routes/')
}
