import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"

type TripsInProgressCount = {
  total_trips: number
}

export function useTripsInProgressCount(){
  return useQuery<TripsInProgressCount>({
    queryKey: ["trips-in-progress-count" ],

    queryFn: async () => {
      return await apiFetch(
        `/dashboard/trips/in-progress/`
      )
    },
  })
}