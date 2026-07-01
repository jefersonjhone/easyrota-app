import { useQuery } from '@tanstack/react-query'
import { fetchUserDetail } from '../services/users-detail'

export function useUserDetail(profileType: 'STUDENT' | 'CIVIL-SERVANT', profileId: string) {
  return useQuery({
    queryKey: ['user-detail', profileType, profileId],
    queryFn: () => fetchUserDetail(profileType, profileId),
    enabled: !!profileType && !!profileId,
  })
}
