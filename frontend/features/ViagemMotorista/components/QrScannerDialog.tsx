import { Button } from '@ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@ui/dialog'

import { QrCodeScanner } from '../QrCodeScanner'
import { FeedbackBanner } from './FeedbackBanner'
import type { QrFeedback } from '../types'

type Props = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  restartSignal: number
  onScan: (decodedText: string) => void | Promise<void>
  onCameraError: (message: string) => void
  isQrCheckInLoading: boolean
  qrFeedback: QrFeedback | null
  onRetry: () => void
}

export function QrScannerDialog({
  isOpen,
  onOpenChange,
  restartSignal,
  onScan,
  onCameraError,
  isQrCheckInLoading,
  qrFeedback,
  onRetry,
}: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-lg sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Check-in por QR Code</DialogTitle>
          <DialogDescription>Leia o QR Code do passageiro para confirmar a reserva nesta viagem.</DialogDescription>
        </DialogHeader>

        <QrCodeScanner isOpen={isOpen} restartSignal={restartSignal} onScan={onScan} onCameraError={onCameraError} />

        <FeedbackBanner feedback={qrFeedback} />

        <DialogFooter>
          <Button type="button" variant="outline" className="rounded-lg" onClick={() => onOpenChange(false)}>
            Cancelar leitura
          </Button>

          {qrFeedback?.kind === 'error' ? (
            <Button type="button" className="rounded-lg" onClick={onRetry} disabled={isQrCheckInLoading}>
              Ler novamente
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
