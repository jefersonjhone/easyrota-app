import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"

type ReservationsByRoute = {
  trip__id: string,
  trip__route__origin: string,
  trip__route__destiny: string,
  trip__trip_date: string,
  total_reservations: number
}[]

export function useReservationsByRoute(days = 7){
  return useQuery<ReservationsByRoute>({
    queryKey: ["reservations-by-route", days],

    queryFn: async () => {
      return await apiFetch(
        `/dashboard/reservations/most-reserved-trips/?days=${days}`
      )
    },
  })
}