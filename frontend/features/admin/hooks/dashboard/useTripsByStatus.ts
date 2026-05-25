import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"

type TripsByStatus = {
  days: number
  total_trips: number
  trips: {
    label: string
    value: number
  }[]
}

export function useTripsByStatus(days = 7){
  return useQuery<TripsByStatus>({
    queryKey: ["trips-by-status", days],

    queryFn: async () => {
      return await apiFetch(
        `/dashboard/trips/status/?days=${days}`
      )
    },
  })
}