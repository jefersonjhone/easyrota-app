import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import type { TripsHistory} from "../types"



export function useTripsHistory(limit: number = 3){
  return useQuery<TripsHistory>({
    queryKey: ["user-trips-history"],
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      return await apiFetch(
        `/reservations/history/?limit=${limit}`
      )
    },
  })
}