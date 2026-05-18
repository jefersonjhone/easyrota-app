
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
      administrator: 0,
}
	const response = await fetch("/api/routes/", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(_values),
	})

	const data: CreateRouteResponse = (await response.json())

	if (!response.ok) { throw data }
	return data
}
