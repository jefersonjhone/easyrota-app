import { useQuery } from '@tanstack/react-query'
import { fetchAllowedStaff, type AllowedStaffParams } from '../services/allowed-staff'

export function useAllowedStaff(params: AllowedStaffParams = {}) {
  return useQuery({
    queryKey: ['allowed-staff', params],
    queryFn: () => fetchAllowedStaff(params),
  })
}
