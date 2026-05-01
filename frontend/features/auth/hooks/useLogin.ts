import { useMutation } from "@tanstack/react-query"

export type LoginValues = {
	email: string
	password: string
}

export type LoginErrors = Record<string, string[]>

export type LoginResponse = {
	message?: string
	detail?: string[]
	non_field_errors?: string[]
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

	const data = (await response.json()) as LoginResponse

	if (!response.ok) {
		throw data
	}

	return data
}

export function useLoginMutation() {
	return useMutation({
		mutationFn: loginRequest,
	})
}
