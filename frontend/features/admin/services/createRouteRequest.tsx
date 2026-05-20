import { apiFetch } from "@/lib/api"

export type CreateRouteValues = {
  origin: string
	destiny: string
	departure_time: string
	arrival_time: string
}

type Values = {
  origin: string
	destiny: string
	departure_time: string
	arrival_time: string
  administrator: number
}

export type CreateRouteErrors = Record<string, string[]>

export type CreateRouteResponse = {
	message?: string
	detail?: string[]
	non_field_errors?: string[]
	[key: string]: unknown
}

export async function CreateRouteRequest(values: CreateRouteValues): Promise<CreateRouteResponse> {
  const _values : Values = {
      origin: values.origin,
      destiny: values.destiny,
      departure_time: values.departure_time,
      arrival_time: values.arrival_time,
      administrator: 1,
}
	const response: CreateRouteResponse = await apiFetch("/routes/", {
		method: "POST",
		body: JSON.stringify(_values),
	})

	return response
}
