import { useEffect, useId, useRef, useState } from 'react'
import {
  Html5Qrcode,
  Html5QrcodeScannerState,
  Html5QrcodeSupportedFormats,
} from 'html5-qrcode'

type QrCodeScannerProps = {
  isOpen: boolean
  restartSignal: number
  onScan: (decodedText: string) => void | Promise<void>
  onCameraError: (message: string) => void
}

type CameraState = 'starting' | 'ready' | 'error'

const scannerConfig = {
  fps: 10,
  qrbox: { width: 240, height: 240 },
  aspectRatio: 1.777778,
}

function isScannerActive(scanner: Html5Qrcode) {
  const scannerState = scanner.getState()

  return (
    scannerState === Html5QrcodeScannerState.SCANNING
    || scannerState === Html5QrcodeScannerState.PAUSED
  )
}

async function stopScanner(scanner: Html5Qrcode) {
  try {
    if (isScannerActive(scanner)) {
      await scanner.stop()
    }
  } catch {
    // The camera can already be stopped by the browser permission flow.
  }

  try {
    scanner.clear()
  } catch {
    // html5-qrcode throws if the internal element is already empty.
  }
}

async function startScanner(
  scanner: Html5Qrcode,
  onSuccess: (decodedText: string) => void,
) {
  try {
    await scanner.start(
      { facingMode: 'environment' },
      scannerConfig,
      onSuccess,
      () => undefined,
    )
    return
  } catch {
    const cameras = await Html5Qrcode.getCameras()
    const fallbackCamera = cameras[0]

    if (!fallbackCamera) {
      throw new Error('Nenhuma camera encontrada.')
    }

    await scanner.start(
      fallbackCamera.id,
      scannerConfig,
      onSuccess,
      () => undefined,
    )
  }
}

export function QrCodeScanner({
  isOpen,
  restartSignal,
  onScan,
  onCameraError,
}: QrCodeScannerProps) {
  const reactId = useId()
  const scannerElementId = `driver-qr-reader-${reactId.replace(/:/g, '')}`
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const hasScannedRef = useRef(false)
  const [cameraState, setCameraState] = useState<CameraState>('starting')

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    let isCancelled = false
    hasScannedRef.current = false
    setCameraState('starting')

    const scanner = new Html5Qrcode(scannerElementId, {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false,
    })

    scannerRef.current = scanner

    startScanner(
      scanner,
      (decodedText) => {
          if (hasScannedRef.current) {
            return
          }

          hasScannedRef.current = true
          scanner.pause(true)
          void onScan(decodedText.trim())
        },
    )
      .then(() => {
        if (!isCancelled) {
          setCameraState('ready')
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setCameraState('error')
          onCameraError('Nao foi possivel abrir a camera para ler o QR Code.')
        }
      })

    return () => {
      isCancelled = true
      scannerRef.current = null
      void stopScanner(scanner)
    }
  }, [isOpen, onCameraError, onScan, scannerElementId])

  useEffect(() => {
    if (!isOpen || restartSignal === 0) {
      return
    }

    const scanner = scannerRef.current

    if (!scanner || scanner.getState() !== Html5QrcodeScannerState.PAUSED) {
      return
    }

    hasScannedRef.current = false
    scanner.resume()
    setCameraState('ready')
  }, [isOpen, restartSignal])

  return (
    <div className="grid gap-3">
      <div
        id={scannerElementId}
        className="min-h-72 overflow-hidden rounded-lg bg-slate-950 text-white [&_video]:min-h-72 [&_video]:w-full [&_video]:object-cover"
      />
      {cameraState === 'starting' ? (
        <p className="text-sm font-medium text-muted-foreground">
          Iniciando camera...
        </p>
      ) : null}
      {cameraState === 'ready' ? (
        <p className="text-sm font-medium text-muted-foreground">
          Aponte a camera para o QR Code do passageiro.
        </p>
      ) : null}
      {cameraState === 'error' ? (
        <p className="text-sm font-semibold text-destructive" role="alert">
          Nao foi possivel acessar a camera. Verifique a permissao do navegador.
        </p>
      ) : null}
    </div>
  )
}
