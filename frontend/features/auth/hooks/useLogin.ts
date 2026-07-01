import { API_URL } from "@lib/config";
import { useMutation } from "@tanstack/react-query"
import {
  useAuthStore 
} from "@features/auth/store/auth-store"
import type { AuthUser } from "../types/auth"


export type LoginValues = {
	email: string
	password: string
}

export type LoginErrors = Record<string, string[]>
export type LoginResponse = {
	message?: string
	detail?: string[]
	non_field_errors?: string[]
	tokens?: {
		access: string
		refresh?: string
	}
  user?: AuthUser;
	[key: string]: unknown
}

async function loginRequest(values: LoginValues): Promise<LoginResponse> {
	const response = await fetch(`${API_URL}/login/`, {
		method: "POST",
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(values),
	})

	const data: LoginResponse = (await response.json())

	if (!response.ok) { throw data }
	return data
}

export function useLoginMutation() {
  const setAuth = useAuthStore((state) => state.setAuth)
  
  return useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      const accessToken = data.tokens?.access
      const refreshToken = data.tokens?.refresh ?? null
      const user = data.user

      if (accessToken && user) {
        setAuth(accessToken, refreshToken, user)
        return user
      } else {
        throw new Error('Invalid login response: missing tokens or user data')
      }
    },
  })
}
