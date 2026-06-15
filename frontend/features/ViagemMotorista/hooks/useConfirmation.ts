import { useState } from 'react'
import type { DriverTripDetail } from '../types'
import { unassignDriverFromTrip, startTrip, finishTrip } from '../api'

export function useConfirmation(trip: DriverTripDetail | null, setTrip: (t: DriverTripDetail | null) => void, setActionError: (s: string | null) => void) {
  const [isConfirmationLoading, setIsConfirmationLoading] = useState(false)

  const handleConfirmBack = async () => {
    if (!trip) return

    setIsConfirmationLoading(true)
    setActionError(null)

    try {
      // if trip in progress, just redirect
      const normalized = (trip.status ?? '').normalize('NFD').replace(/[^\p{L}\s]/gu, '').trim().toUpperCase()
      if (normalized === 'EM ANDAMENTO') {
        window.location.href = '/app/driver/viagens'
        return
      }

      await unassignDriverFromTrip(trip.id)
      window.location.href = '/app/driver/viagens'
    } catch (error) {
      console.warn('Nao foi possivel desassociar o motorista da viagem:', error)
      setActionError('Nao foi possivel desassociar o motorista antes de voltar.')
      setIsConfirmationLoading(false)
    }
  }

  const handleStartTrip = async () => {
    if (!trip) return

    setIsConfirmationLoading(true)
    setActionError(null)

    try {
      await startTrip(trip.id)
      trip.status = "EM ANDAMENTO"
      setTrip(trip)
      window.location.reload();  
    } catch (error) {
      console.warn('Nao foi possivel iniciar a viagem:', error)
      setActionError('Nao foi possivel iniciar a viagem.')
    } finally {
      setIsConfirmationLoading(false)
    }
  }

  const handleFinishTrip = async () => {
    if (!trip) return

    setIsConfirmationLoading(true)
    setActionError(null)

    try {
      await finishTrip(trip.id)
      window.location.href = '/app/driver/viagens'
    } catch (error) {
      console.warn('Nao foi possivel finalizar a viagem:', error)
      setActionError('Nao foi possivel finalizar a viagem.')
      setIsConfirmationLoading(false)
    }
  }

  return {
    isConfirmationLoading,
    handleConfirmBack,
    handleStartTrip,
    handleFinishTrip,
  }
}
