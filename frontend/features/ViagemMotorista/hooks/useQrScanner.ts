import { useCallback, useState } from 'react'
import { checkInTripPassenger } from '@features/trips/services/trips'
import type { PassengerBoardItem, DriverTripDetail, QrFeedback } from '../types'
import { getTripFromApi } from '../api'
import { getApiErrorMessage } from '../utils'

type Options = {
  setActionError: (msg: string | null) => void
  setQrFeedback: (f: QrFeedback | null) => void
}

export function useQrScanner(
  trip: DriverTripDetail | null,
  setTrip: (t: DriverTripDetail | null) => void,
  boardedPassengers: PassengerBoardItem[],
  setBoardedPassengers: (p: PassengerBoardItem[]) => void,
  { setActionError, setQrFeedback }: Options,
) {
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false)
  const [isQrCheckInLoading, setIsQrCheckInLoading] = useState(false)
  const [scanRestartSignal, setScanRestartSignal] = useState(0)

  const handleQrCameraError = useCallback((message: string) => {
    setQrFeedback({ kind: 'error', message })
  }, [setQrFeedback])

  const handleQrScan = useCallback(async (decodedText: string) => {
    if (!trip) {
      setQrFeedback({ kind: 'error', message: 'Viagem nao encontrada.' })
      return
    }

    if (!decodedText) {
      setQrFeedback({ kind: 'error', message: 'QR Code invalido.' })
      return
    }

    setIsQrCheckInLoading(true)
    setQrFeedback({ kind: 'info', message: 'QR Code lido. Confirmando check-in...' })

    try {
      const response = await checkInTripPassenger(trip.id, decodedText)
      const passengerName = response.passenger_name ?? 'Passageiro'
      const reservationId = response.reservation_id
      const evictedNames = response.evicted_passengers?.map((p) => p.name).join(', ')

      if (evictedNames) {
        const refreshedTrip = await getTripFromApi(trip.id)
        setTrip({ ...refreshedTrip, isDriverAssociated: trip.isDriverAssociated })
      } else {
        setBoardedPassengers((currentPassengers) => {
          const alreadyRegistered = currentPassengers.some(
            (passenger) => passenger.identifier === decodedText || (reservationId !== undefined && passenger.reservationId === reservationId),
          )

          if (alreadyRegistered) return currentPassengers

          const passengerFromQr: PassengerBoardItem = {
            id: reservationId ?? currentPassengers.length + 1,
            reservationId,
            identifier: decodedText,
            name: passengerName,
            source: 'QR',
          }

          const placeholderIndex = currentPassengers.findIndex(
            (p) => p.source === 'Manual' && p.identifier === undefined && p.name.startsWith('Passageiro '),
          )

          if (placeholderIndex === -1) return [...currentPassengers, passengerFromQr]

          return currentPassengers.map((passenger, index) => (index === placeholderIndex ? { ...passengerFromQr, id: reservationId ?? passenger.id } : passenger))
        })
      }

      setQrFeedback({ kind: evictedNames ? 'info' : 'success', message: evictedNames ? `Check-in realizado para ${passengerName}. Retire do onibus: ${evictedNames}.` : response.status ?? `Check-in realizado para ${passengerName}.` })
      setIsQrScannerOpen(false)
    } catch (error) {
      setQrFeedback({ kind: 'error', message: getApiErrorMessage(error, 'Nao foi possivel confirmar o check-in.') })
      setActionError(null)
    } finally {
      setIsQrCheckInLoading(false)
    }
  }, [trip, setBoardedPassengers, setQrFeedback, setTrip, setActionError])

  const handleRetryQrScan = () => {
    setQrFeedback({ kind: 'info', message: 'Aguardando nova leitura do QR Code.' })
    setScanRestartSignal((s) => s + 1)
  }

  return {
    isQrScannerOpen,
    setIsQrScannerOpen,
    isQrCheckInLoading,
    scanRestartSignal,
    handleQrScan,
    handleQrCameraError,
    handleRetryQrScan,
  }
}
