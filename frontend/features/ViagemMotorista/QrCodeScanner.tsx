import { useEffect, useId, useRef } from 'react'
import {
  Html5Qrcode,
  type Html5QrcodeCameraScanConfig,
  Html5QrcodeScannerState,
  Html5QrcodeSupportedFormats,
} from 'html5-qrcode'

type QrCodeScannerProps = {
  onScan: (decodedText: string) => void
  onCameraError: (message: string) => void
  onStatusChange?: (status: 'loading' | 'ready' | 'error') => void
  enabled: boolean
}

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
  const state = scanner.getState()
  return state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED
}

async function stopScanner(scanner: Html5Qrcode) {
  try {
    if (isScannerActive(scanner)) await scanner.stop()
  } catch { /* camera may already be stopped */ }
  try { scanner.clear() } catch { /* internal element may be empty */ }
}

export function QrCodeScanner({
  onScan,
  onCameraError,
  onStatusChange,
  enabled,
}: QrCodeScannerProps) {
  const reactId = useId()
  const elementId = `driver-qr-reader-${reactId.replace(/:/g, '')}`
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const stopPromiseRef = useRef<Promise<void>>(Promise.resolve())
  const lastScanRef = useRef(0)
  const enabledRef = useRef(enabled)
  const onScanRef = useRef(onScan)
  const onCameraErrorRef = useRef(onCameraError)
  const onStatusChangeRef = useRef(onStatusChange)

  useEffect(() => {
    enabledRef.current = enabled
    onScanRef.current = onScan
    onCameraErrorRef.current = onCameraError
    onStatusChangeRef.current = onStatusChange
  })

  useEffect(() => {
    let cancelled = false

    const scanner = new Html5Qrcode(elementId, {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false,
    })
    scannerRef.current = scanner

    const handleSuccess = (decodedText: string) => {
      if (!enabledRef.current) return
      const now = Date.now()
      if (now - lastScanRef.current < 2000) return
      lastScanRef.current = now
      onScanRef.current(decodedText.trim())
    }

    const startTask = stopPromiseRef.current
      .catch(() => undefined)
      .then(async () => {
        if (cancelled) return
        onStatusChangeRef.current?.('loading')
        document.getElementById(elementId)?.replaceChildren()
        try {
          await scanner.start(
            { facingMode: 'environment' },
            scannerConfig,
            handleSuccess,
            () => undefined,
          )
          if (!cancelled) onStatusChangeRef.current?.('ready')
        } catch {
          await stopScanner(scanner)
          document.getElementById(elementId)?.replaceChildren()
          const cameras = await Html5Qrcode.getCameras()
          const fallback = cameras[0]
          if (!fallback) throw new Error('Nenhuma camera encontrada.')
          await scanner.start(fallback.id, scannerConfig, handleSuccess, () => undefined)
          if (!cancelled) onStatusChangeRef.current?.('ready')
        }
      })
      .catch(() => {
        if (!cancelled) {
          onStatusChangeRef.current?.('error')
          onCameraErrorRef.current('Nao foi possivel abrir a camera para ler o QR Code.')
        }
      })

    return () => {
      cancelled = true
      scannerRef.current = null
      stopPromiseRef.current = startTask
        .catch(() => undefined)
        .then(() => stopScanner(scanner))
    }
  }, [elementId])

  useEffect(() => {
    const scanner = scannerRef.current
    if (!scanner) return
    const state = scanner.getState()
    if (enabled && state === Html5QrcodeScannerState.PAUSED) {
      scanner.resume()
    }
    if (!enabled && state === Html5QrcodeScannerState.SCANNING) {
      scanner.pause(true)
    }
  }, [enabled])

  return (
    <div
      id={elementId}
      className="aspect-[3/4] w-full bg-black [&_video]:!h-full [&_video]:!w-full [&_video]:object-cover"
    />
  )
}
