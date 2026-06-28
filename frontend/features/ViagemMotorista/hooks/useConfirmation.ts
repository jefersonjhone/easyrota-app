import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import type { DriverTripDetail } from '../types'
import { startTrip, finishTrip, unassignDriverFromTrip } from '../api'
import { getApiErrorMessage } from '../utils'

export function useConfirmation(trip: DriverTripDetail | null, _setTrip: (t: DriverTripDetail | null) => void, setActionError: (s: string | null) => void, currentDriverId?: string | null) {
  const [isConfirmationLoading, setIsConfirmationLoading] = useState(false)
  const navigate = useNavigate()

  const handleConfirmBack = async () => {
    if (!trip) return

    setIsConfirmationLoading(true)
    setActionError(null)

    try {
      const isDriver = currentDriverId != null && trip.driverId === currentDriverId
      if (isDriver) {
        await unassignDriverFromTrip(trip.id)
      }
      navigate({ to: '/app/motorista/viagens' })
    } catch (error) {
      const msg = getApiErrorMessage(error, 'Nao foi possivel voltar.')
      toast.error(msg)
      setActionError(msg)
      setIsConfirmationLoading(false)
    }
  }

  const handleStartTrip = async () => {
    if (!trip) return

    setIsConfirmationLoading(true)
    setActionError(null)

    try {
      await startTrip(trip.id)
      toast.success('Viagem iniciada com sucesso!')
      navigate({ to: '/app/motorista/viagem/$tripId', params: { tripId: trip.id }, replace: true })
    } catch (error) {
      const msg = getApiErrorMessage(error, 'Nao foi possivel iniciar a viagem.')
      toast.error(msg)
      setActionError(msg)
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
      toast.success('Viagem finalizada com sucesso!')
      navigate({ to: '/app/motorista/viagens' })
    } catch (error) {
      const msg = getApiErrorMessage(error, 'Nao foi possivel finalizar a viagem.')
      toast.error(msg)
      setActionError(msg)
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
