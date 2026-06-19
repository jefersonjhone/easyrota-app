import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"

export type GuestHistoryItem = {
  id: string
  full_name: string
  trip_id: string
  trip_origin: string
  trip_destiny: string
  trip_date: string
}

export function useGuestHistory() {
  return useQuery<GuestHistoryItem[]>({
    queryKey: ["guest-history"],
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async () => await apiFetch("/guests/history/"),
  })
}
