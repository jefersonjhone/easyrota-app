import { QrCodeIcon } from '@phosphor-icons/react'
import { cn } from '@utils'
import { FeedbackBanner } from './FeedbackBanner'
import type { QrFeedback } from '../types'

type Props = {
  canReadQr: boolean
  isQrCheckInLoading: boolean
  onOpenQrScanner: () => void
  qrAccessMessage: string | null
  qrFeedback: QrFeedback | null
  isQrScannerOpen: boolean
  embarkedCount: number
  qrCount: number
  manualCount: number
}

export function AsidePanel({
  canReadQr,
  isQrCheckInLoading,
  onOpenQrScanner,
  qrAccessMessage,
  qrFeedback,
  isQrScannerOpen,
  embarkedCount,
  qrCount,
  manualCount,
}: Props) {
  return (
    <aside className="grid content-start gap-4" aria-label="Leitura de QR e lotacao">
      <FeedbackBanner feedback={!isQrScannerOpen ? qrFeedback : null} />
      <button
        type="button"
        className={cn(
          'grid justify-items-center gap-3 rounded-lg border border-border bg-background p-4 text-center shadow-md transition hover:border-primary hover:shadow-lg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30',
          !canReadQr && 'opacity-70',
        )}
        onClick={onOpenQrScanner}
        disabled={isQrCheckInLoading || !canReadQr}
      >
        <span className="grid size-32 place-items-center rounded-lg bg-muted text-foreground">
          <QrCodeIcon weight="regular" className="size-28" />
        </span>
        <strong className="text-sm font- uppercase text-foreground">Ler QR</strong>
      </button>

      {qrAccessMessage ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
          {qrAccessMessage}
        </p>
      ) : null}


      <section className="rounded-lg border border-border bg-background p-4 shadow-md" aria-labelledby="driver-passengers-title">
        <h2 id="driver-passengers-title" className=" font-medium text-lg text-center">Controle de lotacao</h2>
        <div className="mt-4 grid grid-cols-3 gap-2" aria-label="Resumo dos embarques">
          <span className="grid min-h-20 place-items-center rounded-lg border border-border bg-muted/30 p-2 text-center text-xs text-muted-foreground">
            <strong className="block text-2xl text-primary">{embarkedCount}</strong>
            embarques
          </span>
          <span className="grid min-h-20 place-items-center rounded-lg border border-border bg-muted/30 p-2 text-center text-xs text-muted-foreground">
            <strong className="block text-2xl  text-primary">{qrCount}</strong>
            QR
          </span>
          <span className="grid min-h-20 place-items-center rounded-lg border border-border bg-muted/30 p-2 text-center text-xs text-muted-foreground">
            <strong className="block text-2xl text-primary">{manualCount}</strong>
            manual
          </span>
        </div>
      </section>
    </aside>
  )
}
