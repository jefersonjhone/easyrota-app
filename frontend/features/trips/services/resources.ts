import { apiFetch } from '@lib/api'

export type Bus = {
  id: string
  number_plate: string
  seating_capacity: number
  brand: string
  driver: string | null
  administrator: string | null
}

export type Route = {
  id: string
  origin: string
  destiny: string
  departure_time: string
  arrival_time: string
  administrator: string | null
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

export function fetchRoutes() {
  return apiFetch<Route[]>('/routes/')
}

export function fetchDrivers() {
  return apiFetch<Driver[]>('/drivers/')
}
