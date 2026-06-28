import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import MotoristaLayout from '@layout/motorista-layout'
import { Button } from '@ui/button'
import {
  ArrowLeftIcon,
  Briefcase,
  CheckCircleIcon,
  GraduationCap,
  MapPinLine,
  UserCircle,
  UserMinusIcon,
  UserPlusIcon,
  UsersIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react'

import { FeedbackBanner } from './components/FeedbackBanner'
import { PassengerRegisterDialog } from './components/PassengerRegisterDialog'
import { PassengerRemoveDialog } from './components/PassengerRemoveDialog'
import { QrCodeScanner } from './QrCodeScanner'
import { usePassengers } from './hooks/usePassengers'
import { useQrScanner } from './hooks/useQrScanner'
import { getTripFromApi, getTripReservationsFromApi } from './api'
import { getStatusTone } from '@/features/user-home/config'
import type { DriverTripDetail, PassengerBoardItem, QrFeedback, ReservationItem } from './types'

type ScannerOverlay =
  | { kind: 'idle' }
  | { kind: 'success'; name: string }
  | { kind: 'error'; message: string }

type Props = {
  tripId: string
}

export function CheckinPage({ tripId }: Props) {
  const navigate = useNavigate()
  const [actionError, setActionError] = useState<string | null>(null)
  const [qrFeedback, setQrFeedback] = useState<QrFeedback | null>(null)
  const [boardedPassengers, setBoardedPassengers] = useState<PassengerBoardItem[]>([])
  const [trip, setTrip] = useState<DriverTripDetail | null>(null)
  const [isTripLoading, setIsTripLoading] = useState(true)
  const [reservations, setReservations] = useState<ReservationItem[]>([])
  const [isReservationsLoading, setIsReservationsLoading] = useState(true)
  const [showPending, setShowPending] = useState(true)

  const [scannerOverlay, setScannerOverlay] = useState<ScannerOverlay>({ kind: 'idle' })
  const [scannerEnabled, setScannerEnabled] = useState(true)
  const [cameraForceDisabled, setCameraForceDisabled] = useState(false)
  const effectiveScannerEnabled = scannerEnabled && !cameraForceDisabled
  const [cameraStatus, setCameraStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let isMounted = true
    getTripFromApi(tripId)
      .then((data) => { if (isMounted) setTrip(data) })
      .catch(() => { if (isMounted) setTrip(null) })
      .finally(() => { if (isMounted) setIsTripLoading(false) })
    return () => { isMounted = false }
  }, [tripId])

  useEffect(() => {
    if (!trip) return
    let isMounted = true
    getTripReservationsFromApi(trip.id)
      .then((data) => { if (isMounted) setReservations(data) })
      .catch(() => { if (isMounted) setReservations([]) })
      .finally(() => { if (isMounted) setIsReservationsLoading(false) })
    return () => { isMounted = false }
  }, [trip])

  const refreshReservations = useCallback(() => {
    if (!trip) return
    getTripReservationsFromApi(trip.id)
      .then(setReservations)
      .catch(() => setReservations([]))
  }, [trip])

  const passengers = usePassengers(trip, setTrip, setBoardedPassengers, { setActionError, setQrFeedback, onCheckinChange: refreshReservations })

  const handleScanComplete = useCallback((result: { success: boolean; passengerName?: string }) => {
    if (result.success && result.passengerName) {
      setScannerOverlay({ kind: 'success', name: result.passengerName })
      setQrFeedback(null)
      cooldownRef.current = setTimeout(() => {
        setScannerOverlay({ kind: 'idle' })
        setScannerEnabled(true)
      }, 1500)
    } else if (!result.success) {
      setScannerOverlay({ kind: 'error', message: 'Nao foi possivel processar o check-in.' })
    }
  }, [])

  const {
    handleQrScan,
    handleQrCameraError,
    handleRetryQrScan,
  } = useQrScanner(trip, setTrip, boardedPassengers, setBoardedPassengers, {
    setActionError,
    setQrFeedback,
    onScanComplete: handleScanComplete,
    onCheckinChange: refreshReservations,
  })

  const handleScanEvent = useCallback(async (text: string) => {
    setScannerEnabled(false)
    await handleQrScan(text)
  }, [handleQrScan])

  const handleRetryFromOverlay = () => {
    setScannerOverlay({ kind: 'idle' })
    setScannerEnabled(true)
    setQrFeedback(null)
    handleRetryQrScan()
  }

  const {
    isPassengerMenuOpen, setIsPassengerMenuOpen,
    isRemovePassengerMenuOpen, setIsRemovePassengerMenuOpen,
    passengerName, setPassengerName,
    passengerCpf, setPassengerCpf,
    passengerKind, setPassengerKind,
    passengerStaffQuery, setPassengerStaffQuery,
    staffOptions: staffOptionsFromHook, isStaffSearchLoading, staffSearchError,
    selectedStaff, setSelectedStaff,
    isPassengerSaving,
    handleRegisterPassenger,
    passengerRemoveQuery, setPassengerRemoveQuery,
    removablePassengers, selectedPassengerToRemove, setSelectedPassengerToRemove,
    isPassengerRemoving, handleRemovePassenger,
    handleAddPassenger, handleOpenRemovePassenger,
  } = passengers

  const selectedPassengerIdentifier = selectedPassengerToRemove?.reservationId ?? selectedPassengerToRemove?.localPassengerId
  const canSubmitRemovePassenger = Boolean(selectedPassengerIdentifier) && !isPassengerRemoving

  const handlePassengerSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void handleRegisterPassenger()
  }

  const KindIcon = ({ kind }: { kind?: string | null }) => {
    switch (kind) {
      case 'Servidor': return <Briefcase weight="fill" className="size-3 shrink-0" />
      case 'Aluno': return <GraduationCap weight="fill" className="size-3 shrink-0" />
      default: return <UserCircle weight="fill" className="size-3 shrink-0" />
    }
  }

  const statusColor = (status?: string | null) => {
    const map: Record<string, string> = {
      CONFIRMADA: 'text-blue-600',
      PENDENTE: 'text-amber-600',
    }
    return map[status ?? ''] ?? 'text-muted-foreground'
  }

  const enrichedBoarded = useMemo(() => {
    return [...boardedPassengers]
      .map((bp) => {
        const res = reservations.find((r) => r.id === bp.reservationId)
        return {
          ...bp,
          kind: bp.kind ?? res?.kind ?? 'Servidor',
          checkinDate: res?.checkin_date ?? null,
          status: res?.status,
          createdAt: res?.created_at,
        }
      })
      .sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === 'Servidor' ? -1 : 1
        if (a.createdAt && b.createdAt) return a.createdAt.localeCompare(b.createdAt)
        if (a.createdAt) return -1
        if (b.createdAt) return 1
        return 0
      })
  }, [boardedPassengers, reservations])

  const pendingReservations = useMemo(() => {
    return reservations
      .filter((r) => !r.check_in)
      .sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === 'Servidor' ? -1 : 1
        return a.created_at.localeCompare(b.created_at)
      })
  }, [reservations])

  const capacity = trip?.capacity ?? 46

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearTimeout(cooldownRef.current)
    }
  }, [])

  if (isTripLoading) {
    return (
      <MotoristaLayout>
        <section className="mx-auto w-full max-w-lg px-4 pt-6">
          <div className="grid min-h-56 place-items-center text-center text-sm font-semibold text-muted-foreground">
            Carregando...
          </div>
        </section>
      </MotoristaLayout>
    )
  }

  if (!trip) {
    return (
      <MotoristaLayout>
        <section className="mx-auto w-full max-w-lg px-4 pt-6">
          <div className="grid gap-3 text-center">
            <h1 className="font-heading text-2xl font-semibold text-foreground">Viagem indisponivel</h1>
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
      <section className="mx-auto flex w-full max-w-lg flex-col px-4 pt-6">
        {/* Header: back + occupancy */}
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => window.history.back()}
          >
            <ArrowLeftIcon weight="bold" className="size-5" />
            Voltar
          </button>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <UsersIcon weight="duotone" className="size-3.5" />
            {boardedPassengers.length}/{capacity}
          </span>
        </div>

        {/* Route title */}
        <div className="mb-5 text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <MapPinLine weight="duotone" className="size-4 shrink-0" />
            <p className="text-[9px] font-semibold uppercase tracking-[0.15em]">Rota</p>
          </div>
          <h1 className="font-heading mt-1 text-xl font-semibold leading-tight text-foreground">
            {trip.origin} <span className="font-sans text-base font-medium text-muted-foreground">para</span> {trip.destiny}
          </h1>
        </div>

        {actionError ? (
          <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-center text-sm font-bold text-red-800">
            {actionError}
          </p>
        ) : null}

        <div className="grid gap-4">
          {/* Scanner inline card */}
          <div className={`rounded-2xl bg-muted/30 transition-all duration-300 ${cameraForceDisabled && scannerOverlay.kind === 'idle' ? 'p-2' : 'p-1.5'}`}>
            {cameraForceDisabled && scannerOverlay.kind === 'idle' ? (
              <div className="flex items-center justify-between rounded-[calc(1.5rem-0.375rem)] bg-muted/50 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m2 2 20 20" />
                    <path d="M9.5 3h5L17 5h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3Z" />
                    <path d="M12 10a3 3 0 0 0-2.5 4.7" />
                  </svg>
                  Camera desativada
                </div>
                <button
                  type="button"
                  className="rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all"
                  onClick={() => setCameraForceDisabled(false)}
                >
                  Ativar
                </button>
              </div>
            ) : (
              <>
                <div className="relative overflow-hidden rounded-[calc(1.5rem-0.375rem)] bg-black">
                  <QrCodeScanner
                    onScan={handleScanEvent}
                    onCameraError={handleQrCameraError}
                    onStatusChange={setCameraStatus}
                    enabled={effectiveScannerEnabled}
                  />

                  {/* Camera toggle button */}
                  <button
                    type="button"
                    className="absolute top-2 right-2 z-20 flex size-8 items-center justify-center rounded-full bg-black/50 text-white/80 hover:bg-black/70 hover:text-white transition-colors"
                    onClick={() => setCameraForceDisabled(true)}
                    title="Desativar camera"
                  >
                    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
                      <circle cx="12" cy="13" r="3" />
                      <line x1="2" y1="2" x2="22" y2="22" />
                    </svg>
                  </button>

                  {/* Scanner loading overlay */}
                  {cameraStatus === 'loading' && scannerOverlay.kind === 'idle' ? (
                    <div className="absolute inset-0 z-10 grid place-items-center bg-black/60 transition-all duration-200">
                      <div className="size-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    </div>
                  ) : null}

                  {/* Camera error overlay */}
                  {cameraStatus === 'error' && scannerOverlay.kind === 'idle' ? (
                    <div className="absolute inset-0 z-10 grid place-items-center bg-black/60 px-4 transition-all duration-200">
                      <div className="text-center text-white">
                        <WarningCircleIcon weight="bold" className="mx-auto size-8" />
                        <p className="mt-2 text-sm font-medium">Camera indisponivel</p>
                        <p className="mt-1 text-xs text-white/70">Verifique a permissao do navegador.</p>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="mt-3 rounded-xl font-bold"
                          onClick={() => window.location.reload()}
                        >
                          Tentar novamente
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {/* Scanner success overlay */}
                  {scannerOverlay.kind === 'success' ? (
                    <div
                      key={scannerOverlay.name}
                      className="absolute inset-0 z-10 grid place-items-center bg-green-500/80 transition-all duration-200"
                      style={{ animation: 'scannerOverlayIn 200ms ease-out' }}
                    >
                      <div className="text-center text-white">
                        <CheckCircleIcon weight="bold" className="mx-auto size-10" />
                        <p className="mt-2 text-lg font-bold">{scannerOverlay.name}</p>
                        <p className="text-sm text-white/80">Check-in realizado</p>
                      </div>
                    </div>
                  ) : null}

                  {/* Scanner error overlay */}
                  {scannerOverlay.kind === 'error' ? (
                    <div
                      className="absolute inset-0 z-10 grid place-items-center bg-red-500/80 px-4 transition-all duration-200"
                      style={{ animation: 'scannerOverlayIn 200ms ease-out' }}
                    >
                      <div className="text-center text-white">
                        <WarningCircleIcon weight="bold" className="mx-auto size-8" />
                        <p className="mt-2 text-sm font-medium">{scannerOverlay.message}</p>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="mt-3 rounded-xl font-bold"
                          onClick={handleRetryFromOverlay}
                        >
                          Tentar novamente
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
                {cameraStatus === 'ready' && scannerOverlay.kind === 'idle' ? (
                  <p className="mt-2 text-center text-xs font-medium text-muted-foreground">
                    Aponte a camera para o QR Code do passageiro
                  </p>
                ) : null}
              </>
            )}
          </div>

          {/* Manual / Remover */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex flex-col items-start gap-1 rounded-xl border border-border bg-background px-4 py-3 text-left transition hover:bg-muted/30 active:scale-[0.97]"
              onClick={handleAddPassenger}
            >
              <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                <UserPlusIcon weight="bold" className="size-4" />
                Manual
              </span>
              <span className="text-[10px] leading-tight text-muted-foreground">
                Adicionar passageiro sem QR Code
              </span>
            </button>
            <button
              type="button"
              className="flex flex-col items-start gap-1 rounded-xl border border-border bg-background px-4 py-3 text-left transition hover:bg-muted/30 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none"
              onClick={handleOpenRemovePassenger}
              disabled={boardedPassengers.length === 0 || isPassengerRemoving}
            >
              <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                <UserMinusIcon weight="bold" className="size-4" />
                Remover
              </span>
              <span className="text-[10px] leading-tight text-muted-foreground">
                Remover passageiro do embarque
              </span>
            </button>
          </div>

          <FeedbackBanner feedback={scannerOverlay.kind === 'idle' ? qrFeedback : null} />

          {/* Embarked list */}
          {enrichedBoarded.length > 0 ? (
            <div className="rounded-2xl bg-muted/30 px-4 py-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                <UsersIcon weight="duotone" className="mr-1.5 inline size-3.5 align-text-bottom" />
                Embarcados ({enrichedBoarded.length})
              </h3>
              <div className="grid grid-cols-1 gap-1">
                {enrichedBoarded.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl bg-background px-3 py-2.5 transition-all duration-300"
                    style={{
                      animation: enrichedBoarded.indexOf(item) === 0 && boardedPassengers.length > 0
                        ? 'slideUp 300ms ease-out'
                        : undefined,
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                      <p className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                        <KindIcon kind={item.kind} />
                        {item.kind}
                        {item.status ? <span className={statusColor(item.status)}> · {item.status}</span> : null}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {item.source === 'QR' ? (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          QR
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          Manual
                        </span>
                      )}
                      {item.checkinDate ? (
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(item.checkinDate).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {!isReservationsLoading && enrichedBoarded.length === 0 && reservations.length === 0 ? (
            <div className="rounded-2xl bg-muted/30 px-4 py-5 text-center">
              <p className="text-xs text-muted-foreground">Nenhuma reserva encontrada para esta viagem.</p>
            </div>
          ) : null}

          {/* Pending reservations (collapsible) */}
          {pendingReservations.length > 0 ? (
            <div className="rounded-2xl bg-muted/30 px-4 py-4">
              <button
                type="button"
                onClick={() => setShowPending(!showPending)}
                className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground"
              >
                <span>Aguardando check-in ({pendingReservations.length})</span>
                <svg
                  className={`size-3.5 transition-transform duration-200 ${showPending ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {showPending ? (
                <div className="mt-3 grid grid-cols-1 gap-1">
                  {pendingReservations.map((res) => (
                    <div
                      key={res.id}
                      className="flex items-center justify-between rounded-xl bg-background/50 px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground/70">{res.passenger_name}</p>
                        <p className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                          <KindIcon kind={res.kind} />
                          {res.kind ?? ''}
                          {res.created_at ? ` · ${new Date(res.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}` : null}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${getStatusTone(res.status)}`}>
                        {res.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {isReservationsLoading ? (
            <div className="rounded-2xl bg-muted/30 px-4 py-5 text-center">
              <p className="text-xs text-muted-foreground">Carregando reservas...</p>
            </div>
          ) : null}

          <div className="pb-6" />
        </div>

        {/* Concluir check-in */}
        <div className="-mx-4 mt-auto bg-background px-4 pb-6 pt-3">
          <Button
            type="button"
            className="min-h-12 w-full rounded-2xl bg-primary font-bold text-base text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.98] transition-all"
            onClick={() => navigate({ to: '/app/motorista/viagem/$tripId', params: { tripId } })}
          >
            <CheckCircleIcon weight="bold" className="size-5" />
            Concluir check-in
          </Button>
        </div>

        <PassengerRegisterDialog
          isOpen={isPassengerMenuOpen}
          onOpenChange={setIsPassengerMenuOpen}
          passengerKind={passengerKind}
          onPassengerKindChange={(k) => { setPassengerKind(k); setPassengerName(''); setPassengerCpf('') }}
          passengerStaffQuery={passengerStaffQuery}
          onPassengerStaffQueryChange={(v) => { setPassengerStaffQuery(v); setSelectedStaff(null) }}
          staffOptions={staffOptionsFromHook}
          isStaffSearchLoading={isStaffSearchLoading}
          staffSearchError={staffSearchError}
          selectedStaff={selectedStaff}
          onSelectStaff={setSelectedStaff}
          isGuestPassenger={passengerKind === 'Convidado'}
          passengerName={passengerName}
          onPassengerNameChange={setPassengerName}
          passengerCpf={passengerCpf}
          onPassengerCpfChange={setPassengerCpf}
          isPassengerSaving={isPassengerSaving}
          actionError={actionError}
          onCancel={() => { setIsPassengerMenuOpen(false); setActionError(null) }}
          onSubmit={handlePassengerSubmit}
        />

        <PassengerRemoveDialog
          isOpen={isRemovePassengerMenuOpen}
          onOpenChange={(isOpen) => {
            setIsRemovePassengerMenuOpen(isOpen)
            if (!isOpen) { setPassengerRemoveQuery(''); setSelectedPassengerToRemove(null); setActionError(null) }
          }}
          passengerRemoveQuery={passengerRemoveQuery}
          onPassengerRemoveQueryChange={(v) => { setPassengerRemoveQuery(v); setSelectedPassengerToRemove(null) }}
          boardedPassengersLength={boardedPassengers.length}
          removablePassengers={removablePassengers}
          selectedPassengerToRemove={selectedPassengerToRemove}
          onSelectPassengerToRemove={setSelectedPassengerToRemove}
          isPassengerRemoving={isPassengerRemoving}
          actionError={actionError}
          onCancel={() => { setIsRemovePassengerMenuOpen(false); setPassengerRemoveQuery(''); setSelectedPassengerToRemove(null); setActionError(null) }}
          onSubmit={() => void handleRemovePassenger()}
          canSubmitRemovePassenger={canSubmitRemovePassenger}
        />
      </section>
    </MotoristaLayout>
  )
}
