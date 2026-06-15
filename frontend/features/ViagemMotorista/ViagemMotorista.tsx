import MotoraLayout from '@layout/Motora-layout'
import { Button } from '@ui/button'

import { HeaderActions } from './components/HeaderActions'
import { TripInfo } from './components/TripInfo'
import { OccupancyControls } from './components/OccupancyControls'
import { AsidePanel } from './components/AsidePanel'
import { QrScannerDialog } from './components/QrScannerDialog'
import { PassengerRegisterDialog } from './components/PassengerRegisterDialog'
import { PassengerRemoveDialog } from './components/PassengerRemoveDialog'
import { ConfirmationDialog } from './components/ConfirmationDialog'
import { useTrip } from './hooks/useTrip'
import { useBuses } from './hooks/useBuses'
import { usePassengers } from './hooks/usePassengers'
import { useQrScanner } from './hooks/useQrScanner'
import { useConfirmation } from './hooks/useConfirmation'
import type { ViagemMotoristaProps, PassengerBoardItem, QrFeedback } from './types'
import { useState, type FormEvent } from 'react'
import { normalizeTripStatus } from './utils'

export function ViagemMotorista({ tripId }: ViagemMotoristaProps) {
  // central UI-level state for cross-cutting concerns
  const [actionError, setActionError] = useState<string | null>(null)
  const [qrFeedback, setQrFeedback] = useState<QrFeedback | null>(null)
  const [boardedPassengers, setBoardedPassengers] = useState<PassengerBoardItem[]>([])
  const [confirmation, setConfirmation] = useState<'back' | 'bus' | 'start' | 'finish' | null>(null)

  // Trip loader (assigns driver on load)
  const { trip, setTrip, isTripLoading, tripError } = useTrip(tripId, { setActionError, setQrFeedback })

  // Buses
  const { busOptions, selectedBusId, isBusActionLoading, handleBusSelection } = useBuses(trip, setTrip, setActionError)

  // Passengers (register / remove)
  const passengers = usePassengers(trip, setTrip, setBoardedPassengers, { setActionError, setQrFeedback })

  // QR scanner
  const {
    isQrScannerOpen,
    setIsQrScannerOpen,
    isQrCheckInLoading,
    scanRestartSignal,
    handleQrScan,
    handleQrCameraError,
    handleRetryQrScan,
  } = useQrScanner(trip, setTrip, boardedPassengers, setBoardedPassengers, { setActionError, setQrFeedback })

  // Confirmation actions
  const { isConfirmationLoading, handleConfirmBack, handleStartTrip, handleFinishTrip } = useConfirmation(trip, setTrip, setActionError)

  // expose passengers fields for convenience
  const {
    isPassengerMenuOpen,
    setIsPassengerMenuOpen,
    isRemovePassengerMenuOpen,
    setIsRemovePassengerMenuOpen,
    passengerName,
    setPassengerName,
    passengerCpf,
    setPassengerCpf,
    passengerKind,
    setPassengerKind,
    passengerStaffQuery,
    setPassengerStaffQuery,
    staffOptions: staffOptionsFromHook,
    isStaffSearchLoading,
    staffSearchError,
    selectedStaff,
    setSelectedStaff,
    isPassengerSaving,
    handleRegisterPassenger,
    passengerRemoveQuery,
    setPassengerRemoveQuery,
    removablePassengers,
    selectedPassengerToRemove,
    setSelectedPassengerToRemove,
    isPassengerRemoving,
    handleRemovePassenger,
    handleAddPassenger,
    handleOpenRemovePassenger,
  } = passengers



  // derived values
  const selectedBus = busOptions.find((b) => b.id === selectedBusId) ?? null
  const activeCapacity = selectedBus?.capacity ?? trip?.capacity ?? 46
  const embarkedCount = boardedPassengers.length
  const qrCount = boardedPassengers.filter((p) => p.source === 'QR').length
  const manualCount = boardedPassengers.filter((p) => p.source === 'Manual').length
  const occupancyPercent = Math.min((embarkedCount / activeCapacity) * 100, 100)
  const shouldWarnBeforeRequestingBus = (trip?.associatedBuses ?? 0) >= 2
  const selectedBusPlate = selectedBus?.plate ?? trip?.busPlate ?? 'Sem onibus'
  const normalizedTripStatus = normalizeTripStatus(trip?.status)
  const isTripInProgress = normalizedTripStatus === 'EM ANDAMENTO'
  const isTripFinished = normalizedTripStatus.startsWith('CONCLUI')
  const isStartTripDisabled = isConfirmationLoading || isTripInProgress || isTripFinished
  const isFinishTripDisabled = !isTripInProgress || isConfirmationLoading || isTripFinished
  const canReadQr = Boolean(trip?.isDriverAssociated)
  const qrAccessMessage = !trip?.isDriverAssociated
    ? 'Associe-se a esta viagem antes de ler QR Code.'
    : null
  const whatsappAlertUrl = `https://wa.me/?text=${encodeURIComponent(
    `Estou com problema no onibus ${selectedBusPlate} na viagem de ${trip?.origin ?? 'Origem'} para ${trip?.destiny ?? 'Destino'}`,
  )}`
  const whatsappRequestUrl = `https://wa.me/?text=${encodeURIComponent(
    `Solicito novo onibus para a viagem de ${trip?.origin ?? 'Origem'} para ${trip?.destiny ?? 'Destino'}`,
  )}`

  const confirmationTitle =
    confirmation === 'back'
      ? 'Atencao ao voltar'
      : confirmation === 'start'
        ? 'Iniciar viagem'
        : confirmation === 'finish'
          ? 'Finalizar viagem'
          : 'Solicitar novo onibus'
  const confirmationDescription =
    confirmation === 'back'
      ? isTripInProgress
        ? 'A viagem em andamento continuara vinculada a voce para retomada pela lista.'
        : 'Se o motorista voltar, ele sera desassociado da viagem.'
      : confirmation === 'start'
        ? 'Deseja iniciar esta viagem? Esta acao marcara a viagem como em andamento.'
        : confirmation === 'finish'
          ? 'Deseja finalizar esta viagem? Esta acao marcara a viagem como concluida.'
          : 'Ja existem 2 onibus associados a essa viagem, deseja solicitar mais?'

  const handleOpenQrScanner = () => {
    if (!trip?.isDriverAssociated) {
      setQrFeedback({
        kind: 'error',
        message: 'Motorista nao autorizado para esta viagem.',
      })
      return
    }

    setQrFeedback({
      kind: 'info',
      message: 'Aguardando leitura do QR Code.',
    })
    setIsQrScannerOpen(true)
  }

  const handlePassengerSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void handleRegisterPassenger()
  }

  const selectedPassengerIdentifier = selectedPassengerToRemove?.reservationId ?? selectedPassengerToRemove?.localPassengerId
  const canSubmitRemovePassenger = Boolean(selectedPassengerIdentifier) && !isPassengerRemoving

  if (isTripLoading) {
    return (
      <MotoraLayout user={{ name: 'Motorista', kind: 'driver' }}>
        <section className="mx-auto w-[min(100%-1rem,72rem)] sm:w-[min(100%-2rem,72rem)]">
          <div className="grid min-h-56 place-items-center rounded-lg border border-border bg-background p-8 text-center text-sm font-semibold text-muted-foreground shadow-xl">
            Carregando viagem selecionada...
          </div>
        </section>
      </MotoraLayout>
    )
  }

  if (tripError || !trip) {
    return (
      <MotoraLayout user={{ name: 'Motorista', kind: 'driver' }}>
        <section className="mx-auto w-[min(100%-1rem,72rem)] sm:w-[min(100%-2rem,72rem)]">
          <div className="grid min-h-56 place-items-center rounded-lg border border-border bg-background p-8 text-center shadow-xl">
            <div className="grid gap-3">
              <h1 className="font-heading text-2xl font-semibold text-foreground">
                Viagem indisponivel
              </h1>
              <p className="text-sm font-medium text-muted-foreground">
                {tripError ?? 'Nao foi possivel encontrar a viagem selecionada.'}
              </p>
              <Button asChild className="justify-self-center">
                <a href="/app/driver/viagens">Voltar para viagens</a>
              </Button>
            </div>
          </div>
        </section>
      </MotoraLayout>
    )
  }

  return (
    <MotoraLayout user={{ name: 'Motorista', kind: 'driver' }}>
      <section className="mx-auto w-[min(100%-1rem,72rem)] sm:w-[min(100%-2rem,72rem)]" aria-labelledby="driver-trip-screen-title">
        <div className="relative overflow-hidden rounded-lg border border-border bg-background shadow-md">
          <HeaderActions
            onBack={() => setConfirmation('back')}
            onStart={() => setConfirmation('start')}
            onFinish={() => setConfirmation('finish')}
            whatsappAlertUrl={whatsappAlertUrl}
            isConfirmationLoading={isConfirmationLoading}
            isStartDisabled={isStartTripDisabled}
            isFinishDisabled={isFinishTripDisabled}
          />

          {actionError ? (
            <p
              role="alert"
              className="border-b border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-bold text-red-800"
            >
              {actionError}
            </p>
          ) : null}

          <div className="grid gap-6 p-4 pb-20 md:grid-cols-[minmax(0,1fr)_18rem] md:p-8 md:pb-20">
            <section className="flex min-h-[22rem] flex-col items-center justify-center text-center md:min-h-[27rem]" aria-labelledby="driver-trip-screen-title">
              <TripInfo
                origin={trip.origin}
                destiny={trip.destiny}
                departureTime={trip.departureTime}
                selectedBusId={selectedBusId}
                isBusActionLoading={isBusActionLoading}
                busOptions={busOptions}
                onBusSelection={(busId) => void handleBusSelection(busId)}
              />

              <OccupancyControls
                embarkedCount={embarkedCount}
                activeCapacity={activeCapacity}
                occupancyPercent={occupancyPercent}
                onAddPassenger={handleAddPassenger}
                onOpenRemovePassenger={handleOpenRemovePassenger}
                onRequestBus={() => {
                  if (shouldWarnBeforeRequestingBus) {
                    setConfirmation('bus')
                  } else {
                    window.open(whatsappRequestUrl, '_blank', 'noreferrer')
                  }
                }}
                boardedPassengersLength={boardedPassengers.length}
                isPassengerRemoving={isPassengerRemoving}
              />
            </section>

            <AsidePanel
              canReadQr={canReadQr}
              isQrCheckInLoading={isQrCheckInLoading}
              onOpenQrScanner={handleOpenQrScanner}
              qrAccessMessage={qrAccessMessage}
              qrFeedback={qrFeedback}
              isQrScannerOpen={isQrScannerOpen}
              embarkedCount={embarkedCount}
              qrCount={qrCount}
              manualCount={manualCount}
            />
          </div>

        </div>

        <QrScannerDialog
          isOpen={isQrScannerOpen}
          onOpenChange={setIsQrScannerOpen}
          restartSignal={scanRestartSignal}
          onScan={handleQrScan}
          onCameraError={handleQrCameraError}
          isQrCheckInLoading={isQrCheckInLoading}
          qrFeedback={qrFeedback}
          onRetry={handleRetryQrScan}
        />

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
            if (!isOpen) {
              setPassengerRemoveQuery('')
              setSelectedPassengerToRemove(null)
              setActionError(null)
            }
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

        <ConfirmationDialog
          open={confirmation !== null}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setConfirmation(null)
            }
          }}
          confirmation={confirmation}
          title={confirmationTitle}
          description={confirmationDescription}
          actionError={actionError}
          isConfirmationLoading={isConfirmationLoading}
          onConfirmBack={() => void handleConfirmBack()}
          onConfirmStart={() => void handleStartTrip()}
          onConfirmFinish={() => void handleFinishTrip()}
          whatsappRequestUrl={whatsappRequestUrl}
        />
      </section>
    </MotoraLayout>
  )
}
