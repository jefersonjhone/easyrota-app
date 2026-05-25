import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"

export type UserStatsResponse = {
  total_users: number;
  profiles: Array<{
    label: string;
    value: number;
  }>;
  
};

export function useUsersGrowth(days = 7){
  return useQuery<UserStatsResponse>({
    queryKey: ["users-growth", days],

    queryFn: async () => {
      return await apiFetch(
        `/dashboard/users/growth/?days=${days}`
      )
    },
  })
}