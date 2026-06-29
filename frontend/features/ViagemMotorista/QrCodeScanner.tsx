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
  videoConstraints: {
    width: { min: 640, ideal: 1280 },
    height: { min: 480, ideal: 720 },
  },
}

function isScannerActive(scanner: Html5Qrcode) {
  const state = scanner.getState()
  return state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED
}

async function stopScanner(scanner: Html5Qrcode) {
  try {
    if (isScannerActive(scanner)) {
      console.debug('[QrCodeScanner] stopping scanner')
      await scanner.stop()
    }
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
      useBarCodeDetectorIfSupported: true,
    })
    scannerRef.current = scanner
    console.debug('[QrCodeScanner] BarcodeDetector supported:', 'BarcodeDetector' in window)

    const handleSuccess = (decodedText: string) => {
      if (!enabledRef.current) {
        console.debug('[QrCodeScanner] scan ignored — scanner disabled')
        return
      }
      const now = Date.now()
      if (now - lastScanRef.current < 2000) {
        console.debug('[QrCodeScanner] scan ignored — cooldown')
        return
      }
      lastScanRef.current = now
      const trimmed = decodedText.trim()
      console.debug('[QrCodeScanner] QR decoded:', trimmed.slice(0, 80))
      onScanRef.current(trimmed)
    }

    const handleDecodeError = (error: string) => {
      console.warn('[QrCodeScanner] decode error:', error)
    }

    const startTask = stopPromiseRef.current
      .catch(() => undefined)
      .then(async () => {
        if (cancelled) return
        onStatusChangeRef.current?.('loading')
        document.getElementById(elementId)?.replaceChildren()

        const cameras = await Html5Qrcode.getCameras()
        console.debug('[QrCodeScanner] cameras found:', cameras.length, cameras.map((c) => ({ id: c.id, label: c.label })))

        const rearCamera = cameras.find(
          (c) => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('environment')
        )
        const selected = rearCamera ?? cameras[cameras.length - 1] ?? cameras[0]
        if (!selected) throw new Error('Nenhuma camera encontrada.')

        const cameraId = selected.id
        console.debug('[QrCodeScanner] starting with camera:', cameraId, selected.label)

        await scanner.start(cameraId, scannerConfig, handleSuccess, handleDecodeError)
        if (!cancelled) {
          const v = document.querySelector(`#${elementId} video`) as HTMLVideoElement | null
          console.debug('[QrCodeScanner] camera started, video:', v?.videoWidth, 'x', v?.videoHeight)
          onStatusChangeRef.current?.('ready')
        }
      })
      .catch((err) => {
        console.warn('[QrCodeScanner] camera failed:', err)
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
      console.debug('[QrCodeScanner] resuming')
      scanner.resume()
    }
    if (!enabled && state === Html5QrcodeScannerState.SCANNING) {
      console.debug('[QrCodeScanner] pausing')
      scanner.pause(true)
    }
  }, [enabled])

  return (
    <div
      id={elementId}
      className="w-full bg-black [&_video]:!h-full [&_video]:!w-full [&_video]:object-contain"
    />
  )
}
