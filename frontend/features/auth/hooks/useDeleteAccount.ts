import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../store/auth-store"
import { apiFetch } from "@/lib/api";
import { Route as LoginRoute } from "@pages/login"

async function deleteAccountRequest(password: string) {
    await apiFetch("/auth/delete-account/", {
        method: "DELETE",
        body: JSON.stringify({ password }),
    })
}

export function useDeleteAccountMutation() {
    const navigate = useNavigate()
    const clearAuth = useAuthStore((state) => state.clearAuth)
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteAccountRequest,
        onSuccess: () => {
            clearAuth()
            queryClient.clear()
            navigate({ to: LoginRoute.to, replace: true })
        },

        onError: (error) => {
            console.log(error)
        }
    })
}