import { API_URL } from "@lib/config";
import { useMutation } from "@tanstack/react-query"

export type SignupVariant = "civil-servant" | "student"

export type SignupValues = {
	email: string
	fullName: string
	id: string
	password: string
	confirmPassword: string
}

export type SignupResponse = {
	message?: string
	detail?: string[]
	non_field_errors?: string[]
	[key: string]: unknown
}

export type SignupErrors = Record<string, string[]>

async function signupRequest(variant: SignupVariant, values: SignupValues): Promise<SignupResponse> {
	const payload: Record<string, string> = {
		email: values.email,
		full_name: values.fullName,
		password: values.password,
		password_confirmation: values.confirmPassword,
		profile_type: variant,
	}

	if (variant === "civil-servant") {
		payload.civil_servant_id = values.id
	} else {
		payload.student_id = values.id
	}

	const response = await fetch(`${API_URL}/register/`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	})

	const data: SignupResponse = await response.json()

	if (!response.ok) {
		throw data
	}

	return data
}

export function useSignupMutation(variant: SignupVariant) {
	return useMutation({
		mutationFn: (values: SignupValues) => signupRequest(variant, values),
	})
}
