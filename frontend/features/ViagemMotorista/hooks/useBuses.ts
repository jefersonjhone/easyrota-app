import { useEffect, useState } from 'react'
import type { DriverBusOption, DriverTripDetail } from '../types'
import { getBusesFromApi, assignBusToTrip, unassignBusFromTrip, assignDriverToTrip } from '../api'

export function useBuses(
  trip: DriverTripDetail | null,
  setTrip: (t: DriverTripDetail | null) => void,
  setActionError: (msg: string | null) => void,
) {
  const [busOptions, setBusOptions] = useState<DriverBusOption[]>([])
  const [selectedBusId, setSelectedBusId] = useState<number | null>(null)
  const [isBusActionLoading, setIsBusActionLoading] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadBuses = async () => {
      try {
        const buses = await getBusesFromApi()
        if (!isMounted) return
        setBusOptions(buses)
      } catch (error) {
        console.warn('Nao foi possivel carregar os onibus cadastrados:', error)
        if (isMounted) {
          setBusOptions([])
          setSelectedBusId(null)
        }
      }
    }

    loadBuses()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (busOptions.length === 0) {
      setSelectedBusId(null)
      return
    }

    if (trip?.busId && busOptions.some((bus) => bus.id === trip.busId)) {
      setSelectedBusId(trip.busId)
      return
    }

    const matchingBus = trip?.busPlate ? busOptions.find((bus) => bus.plate === trip.busPlate) : null
    setSelectedBusId(matchingBus?.id ?? null)
  }, [busOptions, trip])

  const handleBusSelection = async (nextBusId: number | null) => {
    if (!trip) return

    const previousBusId = selectedBusId
    const nextBus = busOptions.find((bus) => bus.id === nextBusId) ?? null

    setSelectedBusId(nextBusId)
    setIsBusActionLoading(true)
    setActionError(null)

    try {
      if (nextBusId) {
        await assignDriverToTrip(trip.id)
        await assignBusToTrip(trip.id, nextBusId)
      } else {
        await unassignBusFromTrip(trip.id)
      }

      setTrip((currentTrip) =>
        currentTrip
          ? {
              ...currentTrip,
              busId: nextBusId,
              busPlate: nextBus?.plate ?? currentTrip.busPlate,
              isDriverAssociated: nextBusId ? true : currentTrip.isDriverAssociated,
              associatedBuses: nextBusId ? Math.max(currentTrip.associatedBuses, 1) : 0,
            }
          : currentTrip,
      )
    } catch (error) {
      console.warn('Nao foi possivel atualizar o onibus da viagem:', error)
      setSelectedBusId(previousBusId)
      setActionError('Nao foi possivel atualizar o onibus da viagem.')
    } finally {
      setIsBusActionLoading(false)
    }
  }

  return {
    busOptions,
    selectedBusId,
    setSelectedBusId,
    isBusActionLoading,
    handleBusSelection,
  }
}
