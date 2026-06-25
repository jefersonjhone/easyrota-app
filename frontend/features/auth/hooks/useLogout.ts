import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: logoutRequest,
        onSettled: () => {
            clearAuth()
            queryClient.clear()
            navigate({ to: LoginRoute.to, replace: true })
        },
    })
}