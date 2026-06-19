import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import MotoristaLayout from '@layout/motorista-layout'
import { Button } from '@ui/button'
import { NativeSelect, NativeSelectOption } from '@ui/native-select'
import { useAuthStore } from '@features/auth/store/auth-store'
import { apiFetch } from '@lib/api'
import { getStatusTone } from '@/features/user-home/config'
import {
  ArrowLeftIcon,
  PlayCircleIcon,
  CheckCircleIcon,
  WarningCircleIcon,
  BusIcon,
  CalendarBlankIcon,
  ClockIcon,
  UsersIcon,
  WarningIcon,
  MapPinLine,
} from '@phosphor-icons/react'

import { ConfirmationDialog } from './components/ConfirmationDialog'
import { useBuses } from './hooks/useBuses'
import { useConfirmation } from './hooks/useConfirmation'
import {
  getTripFromApi,
  assignDriverToTrip,
  startCheckin,
} from './api'
import type {
  ViagemMotoristaProps,
  DriverTripDetail,
} from './types'
import { normalizeTripStatus } from './utils'

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'CONFIRMADA': 'Confirmada',
    'EM ANDAMENTO': 'Em Andamento',
    'CONCLUÍDA': 'Concluída',
    'CANCELADA': 'Cancelada',
    'RISCO DE CANCELAMENTO': 'Risco de Cancelamento',
    'PENDENTE': 'Pendente',
  }
  return labels[status] ?? status
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full px-2 md:px-3 py-0.5 md:py-1 text-[9px] md:text-xs font-semibold tracking-wide uppercase ring-1 ${getStatusTone(status)}`}>
      {getStatusLabel(status)}
    </span>
  )
}

export function ViagemMotorista({ tripId }: ViagemMotoristaProps) {
  const navigate = useNavigate()
  const [actionError, setActionError] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<'back' | 'start' | 'finish' | null>(null)
  const [trip, setTrip] = useState<DriverTripDetail | null>(null)
  const [isTripLoading, setIsTripLoading] = useState(true)
  const [tripError, setTripError] = useState<string | null>(null)
  const [isDriverAssociating, setIsDriverAssociating] = useState(false)
  const [isCheckinStarting, setIsCheckinStarting] = useState(false)

  const authDriverId = useAuthStore((s) => s.user?.driver_profile?.id)
  const [profileDriverId, setProfileDriverId] = useState<string | null>(null)

  useEffect(() => {
    if (!authDriverId) {
      apiFetch<{ driver_profile?: { id: string } }>('/profile/')
        .then((data) => setProfileDriverId(data?.driver_profile?.id ?? null))
        .catch(() => setProfileDriverId(null))
    }
  }, [authDriverId])

  const currentDriverId = authDriverId ?? profileDriverId
  const isDriverAssociated = currentDriverId != null && trip?.driverId === currentDriverId
  const isCheckinActive = trip?.checkinStarted != null || normalizeTripStatus(trip?.status) === 'EM ANDAMENTO' || normalizeTripStatus(trip?.status).startsWith('CONCLUI')

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
      setActionError(null)

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
    return () => { isMounted = false }
  }, [tripId])

  const { busOptions, selectedBusId, isBusActionLoading, handleBusSelection } = useBuses(trip, setTrip, setActionError)
  const { isConfirmationLoading, handleConfirmBack, handleStartTrip, handleFinishTrip } = useConfirmation(trip, setTrip, setActionError)

  const selectedBus = busOptions.find((b) => b.id === selectedBusId) ?? null
  const activeCapacity = selectedBus?.capacity ?? trip?.capacity ?? 46
  const embarkedCount = trip?.passengers?.length ?? 0
  const occupancyPercent = Math.min((embarkedCount / activeCapacity) * 100, 100)
  const selectedBusPlate = selectedBus?.plate ?? trip?.busPlate ?? 'Sem onibus'
  const normalizedTripStatus = normalizeTripStatus(trip?.status)
  const isTripInProgress = normalizedTripStatus === 'EM ANDAMENTO'
  const isTripFinished = normalizedTripStatus.startsWith('CONCLUI')
  const isStartTripDisabled = isConfirmationLoading || isTripInProgress || isTripFinished || !isDriverAssociated || !isCheckinActive
  const isFinishTripDisabled = !isTripInProgress || isConfirmationLoading || isTripFinished
  const whatsappAlertUrl = `https://wa.me/?text=${encodeURIComponent(
    `Estou com problema no onibus ${selectedBusPlate} na viagem de ${trip?.origin ?? 'Origem'} para ${trip?.destiny ?? 'Destino'}`,
  )}`
  const whatsappOvercrowdUrl = `https://wa.me/?text=${encodeURIComponent(
    `Informo alta demanda/superlotacao no onibus ${selectedBusPlate} na viagem de ${trip?.origin ?? 'Origem'} para ${trip?.destiny ?? 'Destino'}.`,
  )}`

  const handleAssignDriver = async () => {
    if (!trip) return
    setIsDriverAssociating(true)
    setActionError(null)
    try {
      await assignDriverToTrip(trip.id)
      const refreshed = await getTripFromApi(trip.id)
      setTrip(refreshed)
    } catch (error) {
      console.warn('Erro ao associar motorista:', error)
      setActionError('Nao foi possivel se associar a esta viagem.')
    } finally {
      setIsDriverAssociating(false)
    }
  }

  const handleStartCheckin = async () => {
    if (!trip) return
    setIsCheckinStarting(true)
    setActionError(null)
    try {
      await startCheckin(trip.id)
      navigate({ to: '/app/motorista/checkin/$tripId', params: { tripId: trip.id } })
    } catch (error) {
      console.warn('Erro ao iniciar check-in:', error)
      setActionError('Nao foi possivel iniciar o check-in.')
      setIsCheckinStarting(false)
    }
  }

  const confirmationTitle =
    confirmation === 'back'
      ? 'Atencao ao voltar'
      : confirmation === 'start'
        ? 'Iniciar viagem'
        : 'Finalizar viagem'
  const confirmationDescription =
    confirmation === 'back'
      ? isTripInProgress
        ? 'A viagem em andamento continuara vinculada a voce para retomada pela lista.'
        : 'Se o motorista voltar, ele sera desassociado da viagem.'
      : confirmation === 'start'
        ? 'Deseja iniciar esta viagem? Esta acao marcara a viagem como em andamento.'
        : 'Deseja finalizar esta viagem? Esta acao marcara a viagem como concluida.'

  if (isTripLoading) {
    return (
      <MotoristaLayout>
      <section className="mx-auto w-full max-w-lg px-4 pt-6">
        <div className="grid min-h-56 place-items-center text-center text-sm font-semibold text-muted-foreground">
          Carregando viagem selecionada...
        </div>
      </section>
      </MotoristaLayout>
    )
  }

  if (tripError || !trip) {
    return (
      <MotoristaLayout>
      <section className="mx-auto w-full max-w-lg px-4 pt-6">
        <div className="grid gap-3 text-center">
          <h1 className="font-heading text-2xl font-semibold text-foreground">Viagem indisponivel</h1>
          <p className="text-sm font-medium text-muted-foreground">
            {tripError ?? 'Nao foi possivel encontrar a viagem selecionada.'}
          </p>
          <Button asChild className="justify-self-center">
            <a href="/app/motorista">Voltar para viagens</a>
          </Button>
        </div>
      </section>
      </MotoristaLayout>
    )
  }

  return (
    <MotoristaLayout>
    <section className="mx-auto w-full max-w-6xl  px-4 pt-6">
        <div className="rounded-2xl bg-card">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3">
            <Button
              type="button"
              variant="ghost"
              className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
              onClick={() => setConfirmation('back')}
              disabled={isConfirmationLoading}
            >
              <ArrowLeftIcon weight="bold" className="size-5" />
              Voltar
            </Button>
            <StatusBadge status={trip.status} />
          </div>

          {actionError ? (
            <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-center text-sm font-bold text-red-800">
              {actionError}
            </p>
          ) : null}

          <div className="grid gap-5 px-4 pt-5 pb-4">
            {/* Route */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <MapPinLine weight="duotone" className="size-4 shrink-0 md:size-5" />
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] md:text-[10px]">Rota</p>
              </div>
              <h1 className="font-heading mt-1 text-xl font-semibold leading-tight text-foreground md:text-3xl">
                {trip.origin} <span className="font-sans text-base font-medium text-muted-foreground md:text-xl">para</span> {trip.destiny}
              </h1>
            </div>

            {/* Info rows: Data | Partida */}
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <div className="rounded-xl bg-muted/30 p-2.5 md:p-4">
                <div className="flex items-center gap-1.5">
                  <CalendarBlankIcon weight="duotone" className="size-3.5 text-muted-foreground md:size-4" />
                  <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground md:text-[10px]">Data</p>
                </div>
                <p className="mt-1.5 truncate text-xs font-semibold text-foreground md:text-sm">
                  {trip.departureDate}
                </p>
              </div>
              <div className="rounded-xl bg-muted/30 p-2.5 md:p-4">
                <div className="flex items-center gap-1.5">
                  <ClockIcon weight="duotone" className="size-3.5 text-muted-foreground md:size-4" />
                  <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground md:text-[10px]">Partida</p>
                </div>
                <p className="mt-1.5 truncate text-xs font-semibold text-foreground md:text-sm">
                  {trip.departureTime}
                </p>
              </div>
            </div>

            {/* Ônibus (own row, full width) */}
            <div className="rounded-xl bg-muted/30 p-2.5 md:p-4">
              <div className="flex items-center gap-1.5">
                <BusIcon weight="duotone" className="size-3.5 text-muted-foreground md:size-4" />
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground md:text-[10px]">Ônibus</p>
              </div>
              <NativeSelect
                aria-label="Selecionar onibus da viagem"
                value={selectedBusId ?? ''}
                disabled={isBusActionLoading || !isDriverAssociated}
                onChange={(event) => handleBusSelection(event.target.value || null)}
                className="mt-1.5 w-full"
                size="sm"
              >
                <NativeSelectOption value="">Selecionar</NativeSelectOption>
                {busOptions.map((bus) => (
                  <NativeSelectOption key={bus.id} value={bus.id}>
                    {bus.plate}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>

            {/* Embarques card (when associated) */}
            {isDriverAssociated ? (
              <div className="rounded-xl bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <UsersIcon weight="duotone" className="size-4" />
                  Embarques
                </div>
                <div className="mt-3">
                  <div className="flex items-baseline justify-between text-xs text-muted-foreground">
                    <span>Ocupação</span>
                    <span className="font-semibold text-foreground">
                      {embarkedCount}/{activeCapacity}
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full border border-primary-foreground bg-slate-100">
                    <span
                      className="block h-full rounded-full bg-primary transition-[width]"
                      style={{ width: `${occupancyPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {/* CTA: Associate driver */}
            {!isDriverAssociated && currentDriverId != null ? (
              <div className="rounded-xl bg-primary/5 border border-primary/20 px-5 py-5 text-center">
                <p className="mb-3 text-xs font-medium text-muted-foreground">
                  Você ainda não está associado a esta viagem como motorista.
                </p>
                <Button
                  type="button"
                  className="min-h-11 w-full rounded-xl font-bold text-sm"
                  onClick={() => void handleAssignDriver()}
                  disabled={isDriverAssociating}
                >
                  {isDriverAssociating ? 'Associando...' : 'Sou motorista desta viagem'}
                </Button>
              </div>
            ) : null}

            {/* When associated */}
            {isDriverAssociated ? (
              <>
                {/* Check-in init */}
                {!isCheckinActive && !isTripInProgress && !isTripFinished ? (
                  <div className="rounded-xl bg-primary/5 border border-primary/20 px-5 py-4 text-center">
                    <p className="mb-3 text-xs font-medium text-muted-foreground">
                      Para realizar o embarque dos passageiros, acesse o controle de embarque.
                    </p>
                    <Button
                      type="button"
                      className="min-h-11 w-full rounded-xl font-bold text-sm"
                      onClick={() => void handleStartCheckin()}
                      disabled={isCheckinStarting}
                    >
                      {isCheckinStarting ? 'A iniciar...' : 'Abrir check-in'}
                    </Button>
                  </div>
                ) : null}

                {/* Go to checkin (when checkin already started) */}
                {isCheckinActive && !isTripFinished ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 w-full rounded-xl font-bold text-sm"
                    onClick={() => navigate({ to: '/app/motorista/checkin/$tripId', params: { tripId: trip.id } })}
                  >
                    Controle de embarque
                  </Button>
                ) : null}

                {/* Main CTA row */}
                <div className="grid gap-2">
                  {!isTripInProgress && !isTripFinished ? (
                    <Button
                      type="button"
                      className="min-h-12 w-full rounded-xl font-bold text-base"
                      onClick={() => setConfirmation('start')}
                      disabled={isStartTripDisabled}
                    >
                      <PlayCircleIcon weight="bold" className="size-5" />
                      Iniciar viagem
                    </Button>
                  ) : null}
                  {isTripInProgress ? (
                    <Button
                      type="button"
                      className="min-h-12 w-full rounded-xl font-bold text-base bg-emerald-600 text-white hover:bg-emerald-700"
                      onClick={() => setConfirmation('finish')}
                      disabled={isFinishTripDisabled}
                    >
                      <CheckCircleIcon weight="bold" className="size-5" />
                      Finalizar viagem
                    </Button>
                  ) : null}
                </div>

                {/* Superlotação */}
                <Button type="button" variant="outline" size="sm" className="w-full rounded-xl font-bold text-xs" onClick={() => window.open(whatsappOvercrowdUrl, '_blank', 'noreferrer')}>
                  <WarningIcon weight="bold" className="size-4" />
                  Informar superlotação
                </Button>

                {/* Report link — subtle, at the bottom */}
                <a
                  href={whatsappAlertUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <WarningCircleIcon weight="bold" className="size-3.5" />
                  Reportar problema
                </a>
              </>
            ) : null}
          </div>
        </div>

        <ConfirmationDialog
          open={confirmation !== null}
          onOpenChange={(isOpen) => { if (!isOpen) setConfirmation(null) }}
          confirmation={confirmation}
          title={confirmationTitle}
          description={confirmationDescription}
          actionError={actionError}
          isConfirmationLoading={isConfirmationLoading}
          onConfirmBack={() => void handleConfirmBack()}
          onConfirmStart={() => void handleStartTrip()}
          onConfirmFinish={() => void handleFinishTrip()}
        />
      </section>
      </MotoristaLayout>
  )
}
