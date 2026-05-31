import { useMutation } from "@tanstack/react-query"
import {
  useAuthStore 
} from "@features/auth/store/auth-store"
import type { AuthUser } from "../types/auth"
import { subscribeUserToPush } from "@lib/push-notifications"


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
	}
  user?: AuthUser;
	[key: string]: unknown
}

async function loginRequest(values: LoginValues): Promise<LoginResponse> {
	const response = await fetch("/api/login/", {
		method: "POST",
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
      const tokens = data.tokens?.access
      const user = data.user
      
      if (tokens && user) {
        setAuth(tokens, user)
		return user
      } else {
        throw new Error('Invalid login response: missing tokens or user data')
      }
    },
  })
}
