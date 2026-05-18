import { useQuery } from '@tanstack/react-query'

import {
  getFriendlyError,
  userHomeQueryKeys,
} from '../config'
import {
  fetchCurrentTrip,
  fetchReservationHistory,
} from '../services/dashboard'

export function useUserHomeDashboard() {
  const currentTripQuery = useQuery({
    queryKey: userHomeQueryKeys.currentTrip,
    queryFn: fetchCurrentTrip,
    retry: false,
  })

  const reservationHistoryQuery = useQuery({
    queryKey: userHomeQueryKeys.reservationHistory,
    queryFn: fetchReservationHistory,
    retry: false,
  })

  return {
    currentTrip: currentTripQuery.data ?? null,
    reservationHistory: reservationHistoryQuery.data ?? [],
    isLoading: currentTripQuery.isPending || reservationHistoryQuery.isPending,
    tripError: currentTripQuery.error
      ? getFriendlyError(
          currentTripQuery.error,
          'Não foi possível carregar a sua próxima viagem.',
        )
      : null,
    historyError: reservationHistoryQuery.error
      ? getFriendlyError(
          reservationHistoryQuery.error,
          'Não foi possível carregar seu histórico.',
        )
      : null,
  }
}
