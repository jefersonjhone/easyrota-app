import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import type { Punishment } from "@features/user-home/types"

export function usePunishmentsHistory() {
  return useQuery<Punishment[]>({
    queryKey: ["punishments-history"],
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      return await apiFetch<Punishment[]>(`/reservations/punishments/`)
    },
  })
}