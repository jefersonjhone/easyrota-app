import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fetchReservations, fetchReservationsGrouped, updateReservation, deleteReservation, createReservation, type Reservation, type ReservationFilters, type CreateReservationPayload } from '../services/reservations'

export const reservationsKeys = {
  all: ['reservations'] as const,
  filtered: (filters: ReservationFilters) => ['reservations', filters] as const,
}

export function useReservations(filters: ReservationFilters = {}) {
  return useQuery({
    queryKey: reservationsKeys.filtered(filters),
    queryFn: () => fetchReservations(filters),
  })
}

export function useReservationsGrouped(filters: ReservationFilters = {}) {
  return useQuery({
    queryKey: ['reservations', 'grouped', filters],
    queryFn: () => fetchReservationsGrouped(filters),
  })
} 

export function useCreateReservation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateReservationPayload) => createReservation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reservationsKeys.all })
      toast.success('Passageiro adicionado com sucesso')
    },
    onError: () => toast.error('Erro ao adicionar passageiro'),
  })
}

export function useUpdateReservation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Reservation> }) => updateReservation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reservationsKeys.all })
      toast.success('Reserva atualizada com sucesso')
    },
    onError: () => toast.error('Erro ao atualizar reserva'),
  })
}

export function useDeleteReservation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteReservation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reservationsKeys.all })
      toast.success('Reserva cancelada com sucesso')
    },
    onError: () => toast.error('Erro ao cancelar reserva'),
  })
}
