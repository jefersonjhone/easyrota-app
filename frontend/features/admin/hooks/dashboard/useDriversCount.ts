import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"

export type DriverCount = {
  total_drivers: number;
  };
  

export function useDriversCount(){
  return useQuery<DriverCount>({
    queryKey: ["drivers-count" ],

    queryFn: async () => {
      return await apiFetch(
        `/dashboard/users/drivers/`
      )
    },
  })
}