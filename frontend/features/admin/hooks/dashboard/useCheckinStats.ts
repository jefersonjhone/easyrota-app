import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"

type CheckinStats = {
  days: number
  total_checkins: number
  without_checkin: number
  checkin_rate: number
}

export function useCheckinStats(days = 7){
  return useQuery<CheckinStats>({
    queryKey: ["checkin-stats", days],

    queryFn: async () => {
      return await apiFetch(
        `/dashboard/reservations/checkins/?days=${days}`
      )
    },
  })
}