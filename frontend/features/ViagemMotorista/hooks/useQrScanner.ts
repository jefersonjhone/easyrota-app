import { useCallback, useState } from 'react'
import { checkInTripPassenger } from '@features/trips/services/trips'
import type { PassengerBoardItem, DriverTripDetail, QrFeedback } from '../types'
import { getTripFromApi } from '../api'
import { getApiErrorMessage } from '../utils'

type Options = {
  setActionError: (msg: string | null) => void
  setQrFeedback: (f: QrFeedback | null) => void
  onScanComplete?: (result: { success: boolean; passengerName?: string }) => void
  onCheckinChange?: () => void
}

export function useQrScanner(
  trip: DriverTripDetail | null,
  setTrip: (t: DriverTripDetail | null) => void,
  boardedPassengers: PassengerBoardItem[],
  setBoardedPassengers: (p: PassengerBoardItem[]) => void,
  { setActionError, setQrFeedback, onScanComplete, onCheckinChange }: Options,
) {
  const [isQrCheckInLoading, setIsQrCheckInLoading] = useState(false)

  const handleQrCameraError = useCallback((message: string) => {
    setQrFeedback({ kind: 'error', message })
  }, [setQrFeedback])

  const handleQrScan = useCallback(async (decodedText: string) => {
    if (!trip) {
      setQrFeedback({ kind: 'error', message: 'Viagem nao encontrada.' })
      onScanComplete?.({ success: false })
      return
    }

    if (!decodedText) {
      setQrFeedback({ kind: 'error', message: 'QR Code invalido.' })
      onScanComplete?.({ success: false })
      return
    }

    setIsQrCheckInLoading(true)

    try {
      const response = await checkInTripPassenger(trip.id, decodedText)
      const passengerName = response.passenger_name ?? 'Passageiro'
      const reservationId = response.reservation_id
      const evictedNames = response.evicted_passengers?.map((p) => p.name).join(', ')

      if (evictedNames) {
        const refreshedTrip = await getTripFromApi(trip.id)
        setTrip({ ...refreshedTrip, isDriverAssociated: trip.isDriverAssociated })
      } else {
        const alreadyRegistered = boardedPassengers.some(
          (passenger) =>
            passenger.identifier === decodedText ||
            (reservationId !== undefined && passenger.reservationId === reservationId),
        )
        if (alreadyRegistered) {
          const existing = boardedPassengers.find(
            (p) => p.identifier === decodedText || p.reservationId === reservationId,
          )
          setQrFeedback({ kind: 'info', message: `${existing?.name ?? 'Passageiro'} ja registrado.` })
          onScanComplete?.({ success: true, passengerName: existing?.name ?? 'Passageiro' })
          setIsQrCheckInLoading(false)
          return
        }
        const passengerFromQr: PassengerBoardItem = {
          id: reservationId ?? String(boardedPassengers.length + 1),
          reservationId,
          identifier: decodedText,
          name: passengerName,
          source: 'QR',
        }
        const placeholderIndex = boardedPassengers.findIndex(
          (p) => p.source === 'Manual' && p.identifier === undefined && p.name.startsWith('Passageiro '),
        )
        if (placeholderIndex === -1) {
          setBoardedPassengers([...boardedPassengers, passengerFromQr])
        } else {
          setBoardedPassengers(
            boardedPassengers.map((passenger, index) =>
              index === placeholderIndex
                ? { ...passengerFromQr, id: reservationId ?? passenger.id }
                : passenger,
            ),
          )
        }
      }

      setQrFeedback({
        kind: evictedNames ? 'info' : 'success',
        message: evictedNames
          ? `Check-in realizado para ${passengerName}. Retire do onibus: ${evictedNames}.`
          : response.status ?? `Check-in realizado para ${passengerName}.`,
      })
      onCheckinChange?.()
      onScanComplete?.({ success: true, passengerName })
    } catch (error) {
      setQrFeedback({ kind: 'error', message: getApiErrorMessage(error, 'Nao foi possivel confirmar o check-in.') })
      setActionError(null)
      onScanComplete?.({ success: false })
    } finally {
      setIsQrCheckInLoading(false)
    }
  }, [trip, boardedPassengers, setBoardedPassengers, setQrFeedback, setTrip, setActionError, onScanComplete, onCheckinChange])

  const handleRetryQrScan = useCallback(() => {
    setQrFeedback({ kind: 'info', message: 'Aguardando nova leitura do QR Code.' })
  }, [setQrFeedback])

  return {
    isQrCheckInLoading,
    handleQrScan,
    handleQrCameraError,
    handleRetryQrScan,
  }
}
