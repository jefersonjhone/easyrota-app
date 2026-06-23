import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchPenalties, fetchPenaltiesGrouped, updatePenalty, deletePenalty, type PenaltyFilters } from '../services/penalties'

export const penaltiesKeys = {
  all: ['penalties'] as const,
  filtered: (filters: PenaltyFilters) => ['penalties', filters] as const,
}

export function usePenalties(filters: PenaltyFilters = {}) {
  return useQuery({
    queryKey: penaltiesKeys.filtered(filters),
    queryFn: () => fetchPenalties(filters),
  })
}

export function useUpdatePenalty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { is_active: boolean } }) => updatePenalty(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: penaltiesKeys.all }),
  })
}

export function usePenaltiesGrouped(filters: PenaltyFilters = {}) {
  return useQuery({
    queryKey: ['penalties', 'grouped', filters] as const,
    queryFn: () => fetchPenaltiesGrouped(filters),
  })
}

export function useDeletePenalty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deletePenalty(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: penaltiesKeys.all }),
  })
}
