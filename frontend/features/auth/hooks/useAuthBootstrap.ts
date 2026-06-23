import { useEffect } from "react"
import { useAuthStore } from "../store/auth-store"
import { isTokenExpired } from "../services/decode-token"
import { refreshTokenIfNeeded } from "@/lib/api"

export function useAuthBootstrap() {
  
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const accessToken = useAuthStore((state) => state.accessToken)
  const user = useAuthStore((state) => state.user)
  
  useEffect(() => {
    if (!user) return;
    if (!accessToken || isTokenExpired(accessToken)) {
      refreshTokenIfNeeded().catch(() => { clearAuth(); });
    }
  }, [user, accessToken, clearAuth])
}
