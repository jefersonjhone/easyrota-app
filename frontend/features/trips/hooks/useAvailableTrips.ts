import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'
import type { AvailableTrip } from '@/features/user-home/types'

export const availableTripsKeys = {
  all: ['available-trips'] as const,
}

export function useAvailableTrips() {
  return useQuery({
    queryKey: availableTripsKeys.all,
    queryFn: () => apiFetch<AvailableTrip[]>('/trips/'),
    retry: false,
  })
}

export function useReserveTrip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (tripId: string) =>
      apiFetch('/reservations/', {
        method: 'POST',
        body: JSON.stringify({ trip: tripId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: availableTripsKeys.all })
      toast.success('Reserva realizada com sucesso')
    },
    onError: () => {
      toast.error('Nao foi possivel realizar a reserva')
    },
  })
}
