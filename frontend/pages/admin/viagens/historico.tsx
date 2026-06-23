import { createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '@/features/auth/services/require-admin'
import { TripsAdminHistoryPage } from '@/features/admin/ui/routes/TripsAdminHistoryPage'
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

const DIAS_PAST = ['7', '15', '30', '90', 'month', 'all'] as const
type DiasPast = (typeof DIAS_PAST)[number]

export interface ViagensHistoricoSearch {
  weekdays?: number[]
  statuses?: string[]
  q?: string
  dias?: string
}

export const Route = createFileRoute('/admin/viagens/historico')({
  beforeLoad: requireAdmin,
  component: TripsAdminHistoryPage,
  validateSearch: (search: Record<string, unknown>): ViagensHistoricoSearch => {
    const out: ViagensHistoricoSearch = {}
    const weekdays = parseCSV(search.weekdays).map(Number).filter((n) => !isNaN(n) && n >= 0 && n <= 6)
    if (weekdays.length) out.weekdays = weekdays
    const statuses = parseCSV(search.statuses).filter((s) => TRIP_STATUSES.includes(s as TripStatus)) as TripStatus[]
    if (statuses.length) out.statuses = statuses
    if (typeof search.q === 'string' && search.q) out.q = search.q
    if (DIAS_PAST.includes(search.dias as DiasPast)) {
      out.dias = search.dias as string
    }
    return out
  },
})
