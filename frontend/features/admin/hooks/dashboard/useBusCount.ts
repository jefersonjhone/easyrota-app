import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"

type BusCount = {
  total_buses: number
}

export function useBusCount(){
  return useQuery<BusCount>({
    queryKey: ["buses-count" ],

    queryFn: async () => {
      return await apiFetch(
        `/dashboard/buses/`
      )
    },
  })
}