import { useEffect, useId, useRef, useState } from 'react'
import {
  Html5Qrcode,
  type Html5QrcodeCameraScanConfig,
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

const scannerConfig: Html5QrcodeCameraScanConfig = {
  fps: 10,
  qrbox: (viewfinderWidth, viewfinderHeight) => {
    const minEdge = Math.min(viewfinderWidth, viewfinderHeight)
    const maxSize = Math.max(80, minEdge - 16)
    const preferredSize = Math.min(280, Math.floor(minEdge * 0.72))
    const qrboxSize = Math.min(maxSize, Math.max(120, preferredSize))

    return { width: qrboxSize, height: qrboxSize }
  },
  aspectRatio: 1,
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
  elementId: string,
  onSuccess: (decodedText: string) => void,
) {
  document.getElementById(elementId)?.replaceChildren()

  try {
    await scanner.start(
      { facingMode: 'environment' },
      scannerConfig,
      onSuccess,
      () => undefined,
    )
    return
  } catch {
    await stopScanner(scanner)
    document.getElementById(elementId)?.replaceChildren()

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
  const stopPromiseRef = useRef<Promise<void>>(Promise.resolve())
  const hasScannedRef = useRef(false)
  const [cameraState, setCameraState] = useState<CameraState>('starting')

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    let isCancelled = false
    hasScannedRef.current = false

    const scanner = new Html5Qrcode(scannerElementId, {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false,
    })

    scannerRef.current = scanner

    const handleScanSuccess = (decodedText: string) => {
      if (hasScannedRef.current) {
        return
      }

      hasScannedRef.current = true
      scanner.pause(true)
      void onScan(decodedText.trim())
    }

    const startTask = stopPromiseRef.current
      .catch(() => undefined)
      .then(async () => {
        if (isCancelled) {
          return
        }

        setCameraState('starting')
        await startScanner(scanner, scannerElementId, handleScanSuccess)
      })
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
      stopPromiseRef.current = startTask
        .catch(() => undefined)
        .then(() => stopScanner(scanner))
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
  }, [isOpen, restartSignal])

  return (
    <div className="grid gap-3">
      <div
        id={scannerElementId}
        className="mx-auto aspect-square w-full max-w-md overflow-hidden rounded-lg bg-slate-950 text-white [&_video]:!h-full [&_video]:!w-full [&_video]:object-cover"
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
