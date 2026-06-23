import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  adminAssignDriver,
  adminUnassignDriver,
  adminAssignBus,
  adminUnassignBus,
} from '../services/trip-admin-actions'
import { tripAdminKeys } from './useTripAdminDetail'

export function useAdminAssignDriver(tripId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (driverId: number) => adminAssignDriver(tripId, driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripAdminKeys.detail(tripId) })
      toast.success('Motorista atribuído com sucesso')
    },
    onError: () => toast.error('Erro ao atribuir motorista'),
  })
}

export function useAdminUnassignDriver(tripId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => adminUnassignDriver(tripId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripAdminKeys.detail(tripId) })
      toast.success('Motorista removido com sucesso')
    },
    onError: () => toast.error('Erro ao remover motorista'),
  })
}

export function useAdminAssignBus(tripId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (busId: number) => adminAssignBus(tripId, busId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripAdminKeys.detail(tripId) })
      toast.success('Ônibus atribuído com sucesso')
    },
    onError: () => toast.error('Erro ao atribuir ônibus'),
  })
}

export function useAdminUnassignBus(tripId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => adminUnassignBus(tripId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripAdminKeys.detail(tripId) })
      toast.success('Ônibus removido com sucesso')
    },
    onError: () => toast.error('Erro ao remover ônibus'),
  })
}
