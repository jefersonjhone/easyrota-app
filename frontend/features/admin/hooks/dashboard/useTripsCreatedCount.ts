import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"

type TripsCreatedCount = {
  days: number
  total_trips: number
}

export function useTripsCreatedCount(days = 0){
  return useQuery<TripsCreatedCount>({
    queryKey: ["trips-created-count", days],

    queryFn: async () => {
      return await apiFetch(
        `/dashboard/trips/created/?days=${days}`
      )
    },
  })
}