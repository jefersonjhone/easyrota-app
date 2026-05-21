import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query"
import { useAuthStore } from "../store/auth-store"
import { apiFetch } from "@/lib/api";
import { Route as LoginRoute } from "@pages/login"

async function logoutRequest() {
    await apiFetch("/auth/logout/", {
        method: "POST"
    })
}

export function useLogoutMutation() {
    const navigate = useNavigate()
    const clearAuth = useAuthStore((state) => state.clearAuth)

    return useMutation({
        mutationFn: logoutRequest,
        onSettled: () => {
            clearAuth()
            navigate({ to: LoginRoute.to, replace: true })
        },
    })
}