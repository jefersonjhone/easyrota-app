import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"

type TripsHistory = [
  {
    trip_date: string
    total: number
  }
]

export function useTripsHistory(days = 7){
  return useQuery<TripsHistory>({
    queryKey: ["trips-history", days],

    queryFn: async () => {
      return await apiFetch(
        `/dashboard/trips/dates/?days=${days}`
      )
    },
  })
}