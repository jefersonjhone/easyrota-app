import { apiFetch } from "@/lib/api"
import type {
  TripRequest,
  CreateTripRequestPayload,
  ApproveTripRequestPayload,
  RejectTripRequestPayload
} from "../types"

export async function fetchTripRequests(): Promise<TripRequest[]> {
  return await apiFetch("/trip-requests/")
}

export async function createTripRequest(payload: CreateTripRequestPayload): Promise<TripRequest> {
  return await apiFetch("/trip-requests/", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function approveTripRequest(
  id: number,
  payload: ApproveTripRequestPayload
): Promise<{ status: string; access_code: string; trip_id: number }> {
  return await apiFetch(`/trip-requests/${id}/approve/`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function rejectTripRequest(
  id: number,
  payload: RejectTripRequestPayload
): Promise<{ status: string }> {
  return await apiFetch(`/trip-requests/${id}/reject/`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}
