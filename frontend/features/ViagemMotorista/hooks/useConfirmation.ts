import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { DriverTripDetail } from '../types'
import { startTrip, finishTrip } from '../api'

export function useConfirmation(trip: DriverTripDetail | null, _setTrip: (t: DriverTripDetail | null) => void, setActionError: (s: string | null) => void) {
  const [isConfirmationLoading, setIsConfirmationLoading] = useState(false)
  const navigate = useNavigate()

  const handleConfirmBack = async () => {
    if (!trip) return

    setIsConfirmationLoading(true)
    setActionError(null)

    try {
      navigate({ to: '/app/motorista/viagens' })
    } catch (error) {
      console.warn('Erro ao redirecionar:', error)
      setActionError('Nao foi possivel voltar.')
      setIsConfirmationLoading(false)
    }
  }

  const handleStartTrip = async () => {
    if (!trip) return

    setIsConfirmationLoading(true)
    setActionError(null)

    try {
      await startTrip(trip.id)
      navigate({ to: '/app/motorista/viagem/$tripId', params: { tripId: trip.id }, replace: true })
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
      navigate({ to: '/app/motorista/viagens' })
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
