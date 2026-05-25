import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"

export type TripsByRoute = {
   route_id: number,
   origin: string,
   destiny: string,
   departure_time: string,
   total_trips: number
   }[]

export function useTripsByRoute(days = 0){
  return useQuery<TripsByRoute>({
    queryKey: ["trips-by-route", days],

    queryFn: async () => {
      return await apiFetch(
        `/dashboard/trips/routes/?days=${days}`
      )
    },
  })
}