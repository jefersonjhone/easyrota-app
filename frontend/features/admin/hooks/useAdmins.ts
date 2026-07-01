import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  type CreateAdminPayload,
  type UpdateAdminPayload,
} from '../services/admins'

export const adminsKeys = {
  all: ['admins'] as const,
}

export function useAdmins(q?: string) {
  return useQuery({
    queryKey: [...adminsKeys.all, q],
    queryFn: () => fetchAdmins(q),
  })
}

export function useCreateAdmin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateAdminPayload) => createAdmin(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminsKeys.all }),
  })
}

export function useUpdateAdmin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateAdminPayload }) =>
      updateAdmin(userId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminsKeys.all }),
  })
}

export function useDeleteAdmin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => deleteAdmin(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminsKeys.all }),
  })
}
