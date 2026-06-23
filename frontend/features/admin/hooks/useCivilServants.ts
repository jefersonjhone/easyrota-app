import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchCivilServants,
  createCivilServant,
  updateCivilServant,
  deleteCivilServant,
  type CreateCivilServantPayload,
  type UpdateCivilServantPayload,
} from '../services/civil-servants'

export const civilServantsKeys = {
  all: ['civil-servants'] as const,
}

export function useCivilServants(q?: string) {
  return useQuery({
    queryKey: [...civilServantsKeys.all, q],
    queryFn: () => fetchCivilServants(q),
  })
}

export function useCreateCivilServant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCivilServantPayload) => createCivilServant(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: civilServantsKeys.all }),
  })
}

export function useUpdateCivilServant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCivilServantPayload }) =>
      updateCivilServant(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: civilServantsKeys.all }),
  })
}

export function useDeleteCivilServant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCivilServant(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: civilServantsKeys.all }),
  })
}
