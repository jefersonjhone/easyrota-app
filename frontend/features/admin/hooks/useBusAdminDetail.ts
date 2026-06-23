import { useQuery } from '@tanstack/react-query'
import { fetchBusAdminDetail } from '../services/buses-admin'

export function useBusAdminDetail(id: number) {
  return useQuery({
    queryKey: ['bus', 'admin', id],
    queryFn: () => fetchBusAdminDetail(id),
    enabled: !!id,
  })
}
