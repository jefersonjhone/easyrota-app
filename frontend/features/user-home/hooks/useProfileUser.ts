import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import type { ProfileUser } from "@features/user-home/types"



export function useProfileUser() {
  return useQuery<ProfileUser>({
    queryKey: ["profile-user"],
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      return await apiFetch<ProfileUser>(`/profile/`)
    },
  })
}