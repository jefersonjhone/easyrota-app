import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createTrip,
  deleteTrip,
  fetchCurrentTripDetail,
  fetchNextTrip,
  fetchTrip,
  fetchTrips,
  updateTrip,
} from '../services/trips'
import { fetchBuses, fetchRoutes } from '../services/resources'
import type { Trip } from '../types'

export const tripsKeys = {
  all: ['trips'] as const,
  detail: (id: number) => ['trips', id] as const,
  current: (id: number) => ['trips', id, 'current'] as const,
  nextTrip: ['trips', 'next'] as const,
}

export function useTrips() {
  return useQuery({
    queryKey: tripsKeys.all,
    queryFn: fetchTrips,
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

export function useCurrentTripDetail(id: number) {
  return useQuery({
    queryKey: tripsKeys.current(id),
    queryFn: () => fetchCurrentTripDetail(id),
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
