import {
  BusIcon,
  QrCodeIcon,
  SignOutIcon,
  UserPlusIcon,
  UsersThreeIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react'
import { useEffect, useState } from 'react'

import logo from '@assets/logo-light-mode.svg'
import { apiFetch } from '@lib/api'
import MotoraLayout from '@layout/Motora-layout'

import './ViajemMotorista.css'

type PassengerBoardItem = {
  id: number
  name: string
  source: 'QR' | 'Manual'
}

type DriverTripDetail = {
  id: string
  origin: string
  destiny: string
  departureTime: string
  busPlate: string
  capacity: number
  associatedBuses: number
  passengers: PassengerBoardItem[]
}

type ApiList<T> = T[] | { results?: T[] }

type BusModel = {
  id: number
  number_plate?: string
  plate?: string
  bus_number_plate?: string
  seating_capacity?: number
  capacity?: number
}

type DriverBusOption = {
  id: number
  plate: string
  capacity: number | null
}

type ViajemMotoristaProps = {
  tripId?: string
}

const mockTripDetails: Record<string, DriverTripDetail> = {
  '1': {
    id: '1',
    origin: 'SALVADOR',
    destiny: 'FEIRA',
    departureTime: '07:20',
    busPlate: 'ER-1024',
    capacity: 46,
    associatedBuses: 2,
    passengers: [
      { id: 1, name: 'Passageiro 001', source: 'QR' },
      { id: 2, name: 'Passageiro 002', source: 'QR' },
      { id: 3, name: 'Passageiro 003', source: 'Manual' },
      { id: 4, name: 'Passageiro 004', source: 'QR' },
      { id: 5, name: 'Passageiro 005', source: 'Manual' },
      { id: 6, name: 'Passageiro 006', source: 'QR' },
      { id: 7, name: 'Passageiro 007', source: 'QR' },
    ],
  },
  '2': {
    id: '2',
    origin: 'FEIRA',
    destiny: 'SALVADOR',
    departureTime: '10:30',
    busPlate: 'ER-2048',
    capacity: 46,
    associatedBuses: 1,
    passengers: [
      { id: 1, name: 'Passageiro 001', source: 'QR' },
      { id: 2, name: 'Passageiro 002', source: 'Manual' },
      { id: 3, name: 'Passageiro 003', source: 'QR' },
    ],
  },
  '3': {
    id: '3',
    origin: 'FEIRA',
    destiny: 'SALVADOR',
    departureTime: '14:10',
    busPlate: 'ER-4096',
    capacity: 46,
    associatedBuses: 2,
    passengers: [
      { id: 1, name: 'Passageiro 001', source: 'QR' },
      { id: 2, name: 'Passageiro 002', source: 'QR' },
      { id: 3, name: 'Passageiro 003', source: 'Manual' },
      { id: 4, name: 'Passageiro 004', source: 'QR' },
      { id: 5, name: 'Passageiro 005', source: 'QR' },
      { id: 6, name: 'Passageiro 006', source: 'Manual' },
      { id: 7, name: 'Passageiro 007', source: 'QR' },
    ],
  },
  '4': {
    id: '4',
    origin: 'SALVADOR',
    destiny: 'FEIRA',
    departureTime: '18:40',
    busPlate: 'ER-8192',
    capacity: 46,
    associatedBuses: 1,
    passengers: [
      { id: 1, name: 'Passageiro 001', source: 'Manual' },
      { id: 2, name: 'Passageiro 002', source: 'QR' },
      { id: 3, name: 'Passageiro 003', source: 'QR' },
      { id: 4, name: 'Passageiro 004', source: 'QR' },
    ],
  },
}

function getTripDetail(tripId?: string) {
  if (tripId && mockTripDetails[tripId]) {
    return mockTripDetails[tripId]
  }

  return {
    id: tripId ?? '0',
    origin: 'Origem',
    destiny: 'Destino',
    departureTime: '00:00',
    busPlate: 'ER-0000',
    capacity: 46,
    associatedBuses: 2,
    passengers: mockTripDetails['1'].passengers,
  }
}

function toList<T>(payload: ApiList<T>): T[] {
  return Array.isArray(payload) ? payload : payload.results ?? []
}

function normalizeBusOption(bus: BusModel): DriverBusOption | null {
  const plate = bus.number_plate ?? bus.plate ?? bus.bus_number_plate
  const capacity = bus.seating_capacity ?? bus.capacity ?? null

  if (!plate) {
    return null
  }

  return {
    id: bus.id,
    plate,
    capacity: typeof capacity === 'number' ? capacity : null,
  }
}

async function getBusesFromApi() {
  const payload = await apiFetch<ApiList<BusModel>>('/buses/')

  return toList(payload)
    .map(normalizeBusOption)
    .filter((bus): bus is DriverBusOption => Boolean(bus))
}

export function ViajemMotorista({ tripId }: ViajemMotoristaProps) {
  const trip = getTripDetail(tripId)
  const [boardedPassengers, setBoardedPassengers] = useState<PassengerBoardItem[]>(() => [
    ...trip.passengers,
  ])
  const [confirmation, setConfirmation] = useState<'back' | 'bus' | null>(null)
  const [busOptions, setBusOptions] = useState<DriverBusOption[]>([])
  const [selectedBusId, setSelectedBusId] = useState<number | null>(null)
  const selectedBus = busOptions.find((bus) => bus.id === selectedBusId) ?? null
  const activeCapacity = selectedBus?.capacity ?? trip.capacity
  const embarkedCount = boardedPassengers.length
  const qrCount = boardedPassengers.filter((passenger) => passenger.source === 'QR').length
  const manualCount = boardedPassengers.filter((passenger) => passenger.source === 'Manual').length
  const occupancyPercent = Math.min((embarkedCount / activeCapacity) * 100, 100)
  const shouldWarnBeforeRequestingBus = trip.associatedBuses >= 2
  const hasReachedCapacity = embarkedCount >= activeCapacity
  const whatsappRequestUrl =
    'https://wa.me/?text=Solicito%20um%20novo%20onibus%20para%20esta%20viagem.'

  useEffect(() => {
    setBoardedPassengers([...trip.passengers])
  }, [trip.id, trip.passengers])

  useEffect(() => {
    let isMounted = true

    const loadBuses = async () => {
      try {
        const buses = await getBusesFromApi()

        if (!isMounted) {
          return
        }

        setBusOptions(buses)
        setSelectedBusId((currentBusId) => {
          if (currentBusId && buses.some((bus) => bus.id === currentBusId)) {
            return currentBusId
          }

          const matchingBus = buses.find((bus) => bus.plate === trip.busPlate)

          return matchingBus?.id ?? buses[0]?.id ?? null
        })
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
  }, [trip.busPlate])

  const handleAddPassenger = () => {
    setBoardedPassengers((currentPassengers) => {
      if (currentPassengers.length >= activeCapacity) {
        return currentPassengers
      }

      const nextId = currentPassengers.length + 1

      return [
        ...currentPassengers,
        {
          id: nextId,
          name: `Passageiro ${String(nextId).padStart(3, '0')}`,
          source: 'Manual',
        },
      ]
    })
  }

  const handleFillBus = () => {
    setBoardedPassengers((currentPassengers) => {
      if (currentPassengers.length >= activeCapacity) {
        return currentPassengers
      }

      const passengersToAdd = Array.from(
        { length: activeCapacity - currentPassengers.length },
        (_, index) => {
          const nextId = currentPassengers.length + index + 1

          return {
            id: nextId,
            name: `Passageiro ${String(nextId).padStart(3, '0')}`,
            source: 'Manual' as const,
          }
        },
      )

      return [...currentPassengers, ...passengersToAdd]
    })
  }

  return (
    <MotoraLayout user={{ name: 'Motorista', kind: 'driver' }}>
      <section className="driver-trip-screen" aria-labelledby="driver-trip-screen-title">
        <div className="driver-trip-screen__panel">
          <header className="driver-trip-screen__header">
            <button
              type="button"
              className="driver-trip-screen__back"
              onClick={() => setConfirmation('back')}
            >
              <SignOutIcon aria-hidden="true" weight="bold" />
              VOLTAR
            </button>

            <div className="driver-trip-screen__brand" aria-label="EasyRota">
              <img src={logo} alt="" />
              <span>
                <strong>Easy</strong>Rota
              </span>
            </div>
          </header>

          <div className="driver-trip-screen__body">
            <section className="driver-trip-control" aria-labelledby="driver-trip-screen-title">
              <div className="driver-trip-control__route">
                <p>Viagem atual</p>
                <h1 id="driver-trip-screen-title">
                  {trip.origin} <span>para</span> {trip.destiny}
                </h1>
                <div className="driver-trip-control__meta">
                  <span>{trip.departureTime}</span>
                  <label className="driver-trip-control__bus-select">
                    <BusIcon aria-hidden="true" weight="fill" />
                    <select
                      aria-label="Selecionar onibus da viagem"
                      value={selectedBusId ?? ''}
                      onChange={(event) => {
                        const nextBusId = event.target.value

                        setSelectedBusId(nextBusId ? Number(nextBusId) : null)
                      }}
                    >
                      <option value="">Sem onibus</option>
                      {busOptions.map((bus) => (
                        <option key={bus.id} value={bus.id}>
                          {bus.plate}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="driver-trip-occupancy" aria-label="Lotação do ônibus">
                <div className="driver-trip-occupancy__bar" aria-hidden="true">
                  <span style={{ width: `${occupancyPercent}%` }} />
                </div>
                <strong>
                  {embarkedCount}/{activeCapacity}
                </strong>
              </div>

              <div className="driver-trip-actions" aria-label="Ações da viagem">
                <button type="button" onClick={handleAddPassenger} disabled={hasReachedCapacity}>
                  <UserPlusIcon aria-hidden="true" weight="bold" />
                  ADD Passageiro
                </button>
                <button type="button" onClick={handleFillBus} disabled={hasReachedCapacity}>
                  <UsersThreeIcon aria-hidden="true" weight="bold" />
                  Lotar Onibus
                </button>
                <button
                  type="button"
                  className="driver-trip-actions__wide"
                  onClick={() => {
                    if (shouldWarnBeforeRequestingBus) {
                      setConfirmation('bus')
                    }
                  }}
                >
                  <BusIcon aria-hidden="true" weight="bold" />
                  Solicitar novo onibus
                </button>
              </div>
            </section>

            <aside className="driver-trip-side" aria-label="Leitura de QR e lotação">
              <div className="driver-trip-qr">
                <div className="driver-trip-qr__code" aria-hidden="true">
                  <QrCodeIcon weight="bold" />
                </div>
                <strong>LER QR</strong>
              </div>

              <section className="driver-trip-passengers" aria-labelledby="driver-passengers-title">
                <h2 id="driver-passengers-title">Controle de lotação</h2>
                <p>
                  A barra usa uma lista interna de embarques para calcular o total ocupado.
                </p>
                <div className="driver-trip-passengers__stats" aria-label="Resumo dos embarques">
                  <span>
                    <strong>{embarkedCount}</strong>
                    embarcados
                  </span>
                  <span>
                    <strong>{qrCount}</strong>
                    QR
                  </span>
                  <span>
                    <strong>{manualCount}</strong>
                    manual
                  </span>
                </div>
              </section>
            </aside>
          </div>

          <a
            className="driver-trip-alert-button"
            href={whatsappRequestUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Enviar alerta pelo WhatsApp"
          >
            <WarningCircleIcon aria-hidden="true" weight="bold" />
          </a>
        </div>

        {confirmation ? (
          <div className="driver-trip-confirmation" role="dialog" aria-modal="true">
            <div className="driver-trip-confirmation__card">
              <WarningCircleIcon aria-hidden="true" weight="fill" />
              <h2>
                {confirmation === 'back' ? 'Atenção ao voltar' : 'Solicitar novo ônibus'}
              </h2>
              <p>
                {confirmation === 'back'
                  ? 'Se o motorista voltar, ele será desassociado da viagem.'
                  : 'já existem 2 onibus associados a essa viajem, deseja solicitar mais?'}
              </p>
              <div className="driver-trip-confirmation__actions">
                <button type="button" onClick={() => setConfirmation(null)}>
                  Cancelar
                </button>
                {confirmation === 'back' ? (
                  <a href="/app/driver/viagens">OK</a>
                ) : (
                  <a href={whatsappRequestUrl} target="_blank" rel="noreferrer">
                    OK
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </MotoraLayout>
  )
}
