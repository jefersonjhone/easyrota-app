import type { TripStatus } from '@/features/trips/types'

export const STATUS_CONFIG: Record<TripStatus, { label: string; className: string }> = {
  'CONFIRMADA': { label: 'Confirmada', className: 'bg-green-100 text-green-700' },
  'EM ANDAMENTO': { label: 'Em Andamento', className: 'bg-blue-100 text-blue-700' },
  'CONCLUÍDA': { label: 'Concluída', className: 'bg-muted text-muted-foreground' },
  'CANCELADA': { label: 'Cancelada', className: 'bg-red-100 text-red-700' },
  'RISCO DE CANCELAMENTO': { label: 'Risco de Cancelamento', className: 'bg-orange-100 text-orange-700' },
}

export function StatusBadge({ status }: { status: TripStatus }) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: 'bg-muted text-muted-foreground' }
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${config.className}`}>
      {config.label}
    </span>
  )
}
