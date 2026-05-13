import { useMutation } from "@tanstack/react-query"
import {
	useAuthStore,
} from "@features/auth/store/auth-store"

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
	user?: Record<string, unknown>
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
  
  const setAuth =
		useAuthStore((state) => state.setAuth)
	return useMutation({
		mutationFn: loginRequest,
		onSuccess: (data) => {
					setAuth(
						data.tokens.access,
						data.user
					)
				},
	})
}
