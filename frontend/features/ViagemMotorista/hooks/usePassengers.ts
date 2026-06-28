import { useEffect, useState } from 'react'
import {
  registerLocalTripPassenger,
  removeTripPassenger,
  searchAllowedStaff,
} from '@features/trips/services/trips'
import type { AllowedStaffOption } from '@features/trips/types'
import type { DriverTripDetail, PassengerBoardItem, PassengerKind, QrFeedback } from '../types'
import { getTripFromApi } from '../api'
import { getApiErrorMessage } from '../utils'

type Options = {
  setActionError: (msg: string | null) => void
  setQrFeedback: (f: QrFeedback | null) => void
  onCheckinChange?: () => void
}

export function usePassengers(
  trip: DriverTripDetail | null,
  setTrip: (t: DriverTripDetail | null) => void,
  setBoardedPassengers: (p: PassengerBoardItem[]) => void,
  { setActionError, setQrFeedback, onCheckinChange }: Options,
) {
  const [isPassengerMenuOpen, setIsPassengerMenuOpen] = useState(false)
  const [isRemovePassengerMenuOpen, setIsRemovePassengerMenuOpen] = useState(false)
  const [passengerName, setPassengerName] = useState('')
  const [passengerCpf, setPassengerCpf] = useState('')
  const [passengerKind, setPassengerKind] = useState<PassengerKind>('Servidor')
  const [passengerStaffQuery, setPassengerStaffQuery] = useState('')
  const [staffOptions, setStaffOptions] = useState<AllowedStaffOption[]>([])
  const [selectedStaff, setSelectedStaff] = useState<AllowedStaffOption | null>(null)
  const [isStaffSearchLoading, setIsStaffSearchLoading] = useState(false)
  const [staffSearchError, setStaffSearchError] = useState<string | null>(null)
  const [isPassengerSaving, setIsPassengerSaving] = useState(false)

  const [passengerRemoveQuery, setPassengerRemoveQuery] = useState('')
  const [selectedPassengerToRemove, setSelectedPassengerToRemove] = useState<PassengerBoardItem | null>(null)
  const [isPassengerRemoving, setIsPassengerRemoving] = useState(false)

  useEffect(() => {
    setBoardedPassengers(trip ? [...trip.passengers] : [])
  }, [trip, setBoardedPassengers])

  useEffect(() => {
    if (!isPassengerMenuOpen) return

    const query = passengerStaffQuery.trim()
    if (query.length < 2) {
      setStaffOptions([])
      setStaffSearchError(null)
      setIsStaffSearchLoading(false)
      return
    }

    let isMounted = true
    setIsStaffSearchLoading(true)
    setStaffSearchError(null)

    const timeoutId = window.setTimeout(() => {
      searchAllowedStaff(query)
        .then((staff) => {
          if (!isMounted) return
          setStaffOptions(staff)
          if (selectedStaff && !staff.some((option) => option.id === selectedStaff.id)) {
            setSelectedStaff(null)
          }
        })
        .catch((error) => {
          console.warn('Nao foi possivel buscar servidores:', error)
          if (isMounted) {
            setStaffOptions([])
            setStaffSearchError('Nao foi possivel buscar servidores.')
          }
        })
        .finally(() => {
          if (isMounted) setIsStaffSearchLoading(false)
        })
    }, 250)

    return () => {
      isMounted = false
      window.clearTimeout(timeoutId)
    }
  }, [isPassengerMenuOpen, passengerStaffQuery, selectedStaff])

  const handleAddPassenger = () => {
    setPassengerName('')
    setPassengerCpf('')
    setPassengerKind('Servidor')
    setPassengerStaffQuery('')
    setStaffOptions([])
    setSelectedStaff(null)
    setStaffSearchError(null)
    setIsPassengerMenuOpen(true)
  }

  const handleOpenRemovePassenger = () => {
    setPassengerRemoveQuery('')
    setSelectedPassengerToRemove(null)
    setActionError(null)
    setIsRemovePassengerMenuOpen(true)
  }

  const canSubmitLocalPassenger = Boolean(selectedStaff) && (! (passengerKind === 'Convidado') || (passengerName.trim().length > 0 && passengerCpf.trim().length === 11)) && !isPassengerSaving

  const handleRegisterPassenger = async () => {
    if (!trip || !selectedStaff || !canSubmitLocalPassenger) return

    setIsPassengerSaving(true)
    setActionError(null)

    try {
      const response = await registerLocalTripPassenger({
        trip: trip.id,
        passenger_type: passengerKind === 'Convidado' ? 'LOCAL_GUEST' : 'LOCAL_SERVER',
        allowed_staff_id: passengerKind === 'Convidado' ? undefined : selectedStaff.id,
        associated_staff_id: passengerKind === 'Convidado' ? selectedStaff.id : undefined,
        full_name: passengerKind === 'Convidado' ? passengerName.trim() : undefined,
        cpf: passengerKind === 'Convidado' ? passengerCpf.trim() : undefined,
      })

      const refreshedTrip = await getTripFromApi(trip.id)
      const evictedNames = response.evicted_passengers?.map((p) => p.name).join(', ')
      const registeredName = response.passenger?.name ?? (passengerKind === 'Convidado' ? passengerName.trim() : selectedStaff.name)

      setTrip({ ...refreshedTrip, isDriverAssociated: trip.isDriverAssociated })
      setPassengerName('')
      setPassengerCpf('')
      setPassengerKind('Servidor')
      setPassengerStaffQuery('')
      setStaffOptions([])
      setSelectedStaff(null)
      setStaffSearchError(null)
      setIsPassengerMenuOpen(false)

      setQrFeedback(evictedNames ? { kind: 'info', message: `${registeredName} cadastrado. Retire do onibus: ${evictedNames}.` } : { kind: 'success', message: `${registeredName} cadastrado no embarque.` })
      onCheckinChange?.()
    } catch (error) {
      console.warn('Nao foi possivel cadastrar passageiro local:', error)
      setActionError(getApiErrorMessage(error, 'Nao foi possivel cadastrar passageiro.'))
    } finally {
      setIsPassengerSaving(false)
    }
  }

  const handleRemovePassenger = async () => {
    if (!trip || !selectedPassengerToRemove || !Boolean(selectedPassengerToRemove.reservationId ?? selectedPassengerToRemove.localPassengerId) || isPassengerRemoving) return

    setIsPassengerRemoving(true)
    setActionError(null)

    try {
      const response = await removeTripPassenger({
        trip: trip.id,
        reservation_id: selectedPassengerToRemove.reservationId,
        local_passenger_id: selectedPassengerToRemove.localPassengerId,
      })

      const refreshedTrip = await getTripFromApi(trip.id)
      const removedName = response.removed_passenger?.name ?? selectedPassengerToRemove.name

      setTrip({ ...refreshedTrip, isDriverAssociated: trip.isDriverAssociated })
      setPassengerRemoveQuery('')
      setSelectedPassengerToRemove(null)
      setIsRemovePassengerMenuOpen(false)
      setQrFeedback({ kind: 'success', message: `${removedName} removido do embarque.` })
      onCheckinChange?.()
    } catch (error) {
      console.warn('Nao foi possivel remover passageiro:', error)
      setActionError(getApiErrorMessage(error, 'Nao foi possivel remover passageiro.'))
    } finally {
      setIsPassengerRemoving(false)
    }
  }

  const normalizedPassengerRemoveQuery = passengerRemoveQuery.trim().toLowerCase()
  const removablePassengers = normalizedPassengerRemoveQuery
    ? (trip ? (trip.passengers.filter((p) => p.name.toLowerCase().includes(normalizedPassengerRemoveQuery))) : [])
    : (trip ? trip.passengers : [])

  return {
    // dialogs
    isPassengerMenuOpen,
    setIsPassengerMenuOpen,
    isRemovePassengerMenuOpen,
    setIsRemovePassengerMenuOpen,

    // register form
    passengerName,
    setPassengerName,
    passengerCpf,
    setPassengerCpf,
    passengerKind,
    setPassengerKind,
    passengerStaffQuery,
    setPassengerStaffQuery,
    staffOptions,
    isStaffSearchLoading,
    staffSearchError,
    selectedStaff,
    setSelectedStaff,
    isPassengerSaving,
    canSubmitLocalPassenger,
    handleRegisterPassenger,

    // remove form
    passengerRemoveQuery,
    setPassengerRemoveQuery,
    removablePassengers,
    selectedPassengerToRemove,
    setSelectedPassengerToRemove,
    isPassengerRemoving,
    handleRemovePassenger,

    // helpers
    handleAddPassenger,
    handleOpenRemovePassenger,
  }
}
