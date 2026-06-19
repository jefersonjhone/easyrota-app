import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createTrip,
  deleteTrip,
  fetchNextTrip,
  fetchTrip,
  fetchTrips,
  updateTrip,
} from '../services/trips'
import type { TripFilters } from '../services/trips'
import { fetchBuses, fetchRoutes } from '../services/resources'
import type { Trip } from '../types'

export const tripsKeys = {
  all: ['trips'] as const,
  list: (filters: TripFilters = {}) => ['trips', 'list', filters] as const,
  detail: (id: number) => ['trips', id] as const,
  nextTrip: ['trips', 'next'] as const,
}

export function useTrips(filters: TripFilters = {}) {
  return useQuery({
    queryKey: tripsKeys.list(filters),
    queryFn: () => fetchTrips(filters),
    retry: false,
  })
}

export function useTrip(id: number) {
  return useQuery({
    queryKey: tripsKeys.detail(id),
    queryFn: () => fetchTrip(id),
    enabled: !!id,
  })
}

export function useNextTrip() {
  return useQuery({
    queryKey: tripsKeys.nextTrip,
    queryFn: fetchNextTrip,
    retry: false,
  })
}

export function useCreateTrip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Trip>) => createTrip(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tripsKeys.all }),
  })
}

export function useUpdateTrip(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Trip>) => updateTrip(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripsKeys.all })
      queryClient.invalidateQueries({ queryKey: tripsKeys.detail(id) })
    },
  })
}

export function useDeleteTrip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteTrip(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tripsKeys.all }),
  })
}

export function useBuses() {
  return useQuery({
    queryKey: ['buses'],
    queryFn: fetchBuses,
  })
}

export function useRoutes() {
  return useQuery({
    queryKey: ['routes'],
    queryFn: fetchRoutes,
  })
}
