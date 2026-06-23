import { createFileRoute } from '@tanstack/react-router'
import { TripsPage } from '@/features/admin/ui/routes/TripsPage'
import type { TripStatus } from '@/features/trips/types'

const TRIP_STATUSES: TripStatus[] = [
  'RISCO DE CANCELAMENTO',
  'CANCELADA',
  'CONFIRMADA',
  'EM ANDAMENTO',
  'CONCLUÍDA',
]

function parseCSV(value: unknown): string[] {
  if (typeof value !== 'string' || !value) return []
  return value.split(',').filter(Boolean)
}

const DIAS_UPCOMING = ['1', '7', '15', '30', 'month', 'all'] as const
type DiasUpcoming = (typeof DIAS_UPCOMING)[number]

export interface ViagensSearch {
  statuses?: string[]
  q?: string
  dias?: string
  weekdays?: number[]
  limit?: number
}

export const Route = createFileRoute('/admin/viagens/')({
  component: TripsPage,
  validateSearch: (search: Record<string, unknown>): ViagensSearch => {
    const out: ViagensSearch = {}
    const weekdays = parseCSV(search.weekdays).map(Number).filter((n) => !isNaN(n) && n >= 0 && n <= 6)
    if (weekdays.length) out.weekdays = weekdays
    const statuses = parseCSV(search.statuses).filter((s) => TRIP_STATUSES.includes(s as TripStatus)) as TripStatus[]
    if (statuses.length) out.statuses = statuses
    if (typeof search.q === 'string' && search.q) out.q = search.q
    if (typeof search.limit === 'string' && /^\d+$/.test(search.limit) && Number(search.limit) > 0) {
      out.limit = Number(search.limit)
    }
    if (DIAS_UPCOMING.includes(search.dias as DiasUpcoming)) {
      out.dias = search.dias as string
    }
    return out
  },
})
