import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { refreshSession } from "../services/refresh-session"
import { useAuthStore } from "../store/auth-store"


export function useAuthBootstrap() {
  const setAuth =
    useAuthStore((state) => state.setAuth)

  const clearAuth =
    useAuthStore((state) => state.clearAuth)

  const accessToken = useAuthStore((state) => state.accessToken)
 
  const query = useQuery({
    queryKey: ["auth-bootstrap"],
    queryFn: async () => {
      const data = await refreshSession();
      setAuth(
              data.access_token,
              data.user,
            )
      
            return data.user
    },
    enabled: !accessToken,
    retry: false,
    staleTime: 0,
    gcTime: 1000,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (query.isError) {
      clearAuth()
    }
  }, [
    query.isError,
    clearAuth,
  ])

  return {
    isLoading: query.isPending,
    isAuthenticated : !!accessToken,
    error: query.error,
  }
}