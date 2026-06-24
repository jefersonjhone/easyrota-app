import { useEffect, useState } from 'react'
import type { DriverTripDetail, QrFeedback } from '../types'
import { getTripFromApi } from '../api'

type Options = {
  setActionError?: (msg: string | null) => void
  setQrFeedback?: (feedback: QrFeedback | null) => void
}

export function useTrip(tripId?: string, options: Options = {}) {
  const { setActionError, setQrFeedback } = options
  const [trip, setTrip] = useState<DriverTripDetail | null>(null)
  const [isTripLoading, setIsTripLoading] = useState(true)
  const [tripError, setTripError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadTrip = async () => {
      if (!tripId) {
        setTrip(null)
        setTripError('Viagem nao encontrada.')
        setIsTripLoading(false)
        return
      }

      setIsTripLoading(true)
      setTripError(null)
      setActionError?.(null)
      setQrFeedback?.(null)

      try {
        const tripDetail = await getTripFromApi(tripId)

        if (!isMounted) return
        setTrip(tripDetail)
      } catch (error) {
        console.warn('Nao foi possivel carregar a viagem selecionada:', error)

        if (!isMounted) return

        setTrip(null)
        setTripError('Nao foi possivel carregar a viagem selecionada.')
      } finally {
        if (isMounted) setIsTripLoading(false)
      }
    }

    loadTrip()

    return () => {
      isMounted = false
    }
  }, [tripId, setActionError, setQrFeedback])

  const refreshTrip = async (id?: string) => {
    const tId = id ?? tripId
    if (!tId) return null

    try {
      const refreshed = await getTripFromApi(tId)
      setTrip(refreshed)
      return refreshed
    } catch (error) {
      console.warn('Nao foi possivel atualizar viagem:', error)
      setTripError('Nao foi possivel atualizar a viagem.')
      return null
    }
  }

  return {
    trip,
    setTrip,
    isTripLoading,
    tripError,
    refreshTrip,
  }
}
