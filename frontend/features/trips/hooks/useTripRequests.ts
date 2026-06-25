import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  fetchTripRequests,
  createTripRequest,
  approveTripRequest,
  rejectTripRequest,
} from "../services/tripRequests"
import type {
  CreateTripRequestPayload,
  ApproveTripRequestPayload,
  RejectTripRequestPayload,
} from "../types"

export const USE_TRIP_REQUESTS_KEY = ["trip-requests"]

export function useTripRequests() {
  return useQuery({
    queryKey: USE_TRIP_REQUESTS_KEY,
    queryFn: fetchTripRequests,
  })
}

export function useCreateTripRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateTripRequestPayload) => createTripRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USE_TRIP_REQUESTS_KEY })
    },
  })
}

export function useApproveTripRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: ApproveTripRequestPayload
    }) => approveTripRequest(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USE_TRIP_REQUESTS_KEY })
      queryClient.invalidateQueries({ queryKey: ["trips"] })
    },
  })
}

export function useRejectTripRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: RejectTripRequestPayload
    }) => rejectTripRequest(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USE_TRIP_REQUESTS_KEY })
    },
  })
}
