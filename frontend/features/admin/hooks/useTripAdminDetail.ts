import { useQuery } from '@tanstack/react-query'
import { fetchTripAdminDetail } from '../services/trips-admin'

export const tripAdminKeys = {
  detail: (id: string) => ['trip', 'admin', id] as const,
}

export function useTripAdminDetail(id: string) {
  return useQuery({
    queryKey: tripAdminKeys.detail(id),
    queryFn: () => fetchTripAdminDetail(id),
    enabled: !!id,
  })
}
