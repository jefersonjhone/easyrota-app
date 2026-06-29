import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  bulkDeleteTrips,
  createTrip,
  deleteTrip,
  fetchNextTrip,
  fetchTrip,
  fetchTrips,
  updateTrip,
} from '../services/trips'
import { fetchBuses, fetchDrivers, fetchRoutes } from '../services/resources'
import type { Trip } from '../types'

export const tripsKeys = {
  all: ['trips'] as const,
  detail: (id: string) => ['trips', id] as const,
  nextTrip: ['trips', 'next'] as const,
}

export function useTrips() {
  return useQuery({
    queryKey: tripsKeys.all,
    queryFn: fetchTrips,
    retry: false,
  })
}

export function useTrip(id: string) {
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
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: tripsKeys.all, type: 'all' })
      toast.success('Viagem criada com sucesso')
    },
    onError: () => {
      toast.error('Erro ao criar viagem')
    },
  })
}

export function useUpdateTrip(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Trip>) => updateTrip(id, data),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: tripsKeys.all, type: 'all' })
      toast.success('Viagem atualizada com sucesso')
    },
    onError: () => {
      toast.error('Erro ao atualizar viagem')
    },
  })
}

export function useDeleteTrip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTrip(id),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: tripsKeys.all, type: 'all' })
      toast.success('Viagem excluída com sucesso')
    },
    onError: () => {
      toast.error('Erro ao excluir viagem')
    },
  })
}

export function useBulkDeleteTrips() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => bulkDeleteTrips(ids),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: tripsKeys.all, type: 'all' })
      toast.success('Viagens excluídas com sucesso')
    },
    onError: () => {
      toast.error('Erro ao excluir viagens')
    },

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

export function useDrivers() {
  return useQuery({
    queryKey: ['drivers'],
    queryFn: fetchDrivers,
  })
}
