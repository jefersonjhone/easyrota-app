import { useQuery } from '@tanstack/react-query'
import { fetchTripAdminDetail } from '../services/trips-admin'

export const tripAdminKeys = {
  detail: (id: number) => ['trip', 'admin', id] as const,
}

export function useTripAdminDetail(id: number) {
  return useQuery({
    queryKey: tripAdminKeys.detail(id),
    queryFn: () => fetchTripAdminDetail(id),
    enabled: !!id,
  })
}
