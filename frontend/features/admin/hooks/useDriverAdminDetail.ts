import { useQuery } from '@tanstack/react-query'
import { fetchDriverAdminDetail } from '../services/drivers-admin'

export function useDriverAdminDetail(id: string) {
  return useQuery({
    queryKey: ['driver', 'admin', id],
    queryFn: () => fetchDriverAdminDetail(id),
    enabled: !!id,
  })
}
