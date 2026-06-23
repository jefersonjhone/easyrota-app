import { useMemo, useState } from 'react'
import {
  useDeleteTrip,
  useTrips,
} from '@/features/trips/hooks/useTrips'
import type { Trip, TripStatus } from '@/features/trips/types'
import { Button } from '@ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@ui/dialog'
import { AdminLayout } from '@/features/admin/ui/Layout'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { MagnifyingGlassIcon, Printer } from '@phosphor-icons/react'
import { STATUS_CONFIG } from './StatusBadge'
import { TripTable } from '@/features/admin/ui/TripTable'
import { TripForm } from './TripForm'

const TRIP_STATUSES: TripStatus[] = [
  'RISCO DE CANCELAMENTO',
  'CANCELADA',
  'CONFIRMADA',
  'EM ANDAMENTO',
  'CONCLUÍDA',
]

const DAY_NAMES_LONG = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr + 'T12:00:00').getDay()
}

export function TripsAdminHistoryPage() {
  const navigate = useNavigate()
  const { weekdays = [], statuses = [], q = '', dias = '30' } = useSearch({ from: '/admin/viagens/historico' })

  const selectedWeekdays = useMemo(() => new Set(weekdays), [weekdays])
  const selectedStatuses = useMemo(() => new Set(statuses), [statuses])

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]

  const minDate = useMemo(() => {
    if (dias === 'all') return null
    if (dias === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      return firstDay.toISOString().split('T')[0]
    }
    const d = new Date(todayStr + 'T12:00:00')
    d.setDate(d.getDate() - Number(dias))
    return d.toISOString().split('T')[0]
  }, [dias, todayStr])

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const { data: trips, isLoading, error } = useTrips()
  const deleteMutation = useDeleteTrip()

  function setFilters(partial: Record<string, string | undefined>) {
    navigate({
      from: '/admin/viagens/historico',
      search: (prev) => {
        const current: Record<string, string> = {}
        if (prev.weekdays?.length) current.weekdays = prev.weekdays.join(',')
        if (prev.statuses?.length) current.statuses = prev.statuses.join(',')
        if (prev.q) current.q = prev.q
        if (prev.dias && prev.dias !== '30') current.dias = prev.dias
        const merged = { ...current, ...partial }
        const clean: Record<string, string> = {}
        if (merged.weekdays) clean.weekdays = merged.weekdays
        if (merged.statuses) clean.statuses = merged.statuses
        if (merged.q) clean.q = merged.q
        if (merged.dias && merged.dias !== '30') clean.dias = merged.dias
        return clean
      },
      replace: true,
    })
  }

  const filteredTrips = useMemo(() => {
    if (!trips) return []
    const qLower = q.toLowerCase().trim()
    return trips
      .filter((trip) => {
        if (trip.trip_date >= todayStr) return false
        if (selectedWeekdays.size > 0 && !selectedWeekdays.has(getDayOfWeek(trip.trip_date))) {
          return false
        }
        if (selectedStatuses.size > 0 && !selectedStatuses.has(trip.status)) {
          return false
        }
        if (minDate && trip.trip_date < minDate) return false
        if (qLower && !trip.origin.toLowerCase().includes(qLower) && !trip.destiny.toLowerCase().includes(qLower)) {
          return false
        }
        return true
      })
      .sort((a, b) => b.trip_date.localeCompare(a.trip_date))
  }, [trips, selectedWeekdays, selectedStatuses, q, todayStr, minDate])

  const groupedHistoryTrips = useMemo(() => {
    const map: Record<string, Trip[]> = {}
    for (const trip of filteredTrips) {
      if (!map[trip.trip_date]) map[trip.trip_date] = []
      map[trip.trip_date].push(trip)
    }
    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, trips]) => {
        const d = new Date(date + 'T12:00:00')
        const dayName = DAY_NAMES_LONG[d.getDay()]
        const [year, m, day] = date.split('-')
        return { date, label: `${dayName}, ${day}/${m}/${year}`, trips }
      })
  }, [filteredTrips])

  function toggleWeekday(day: number) {
    const next = new Set(selectedWeekdays)
    if (next.has(day)) next.delete(day)
    else next.add(day)
    setFilters({ weekdays: [...next].join(',') || undefined })
  }

  function toggleSelect(id: number) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleToggleAll(ids: number[], select: boolean) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      for (const id of ids) {
        if (select) next.add(id)
        else next.delete(id)
      }
      return next
    })
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  function handlePrintSelected() {
    const ids = [...selectedIds]
    if (ids.length === 0) return
    window.open(`/admin/viagens/print?ids=${ids.join(',')}`, '_blank')
  }

  function openEdit(trip: Trip) {
    setEditingTrip(trip)
    setIsEditOpen(true)
  }

  function handleDelete(id: number) {
    deleteMutation.mutate(id)
  }

  return (
    <AdminLayout>
      <section className="mx-auto w-full max-w-5xl px-4">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
              Viagens e Rotas
            </p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              Histórico
            </h1>
            <p className="text-muted-foreground">
              Viagens que já ocorreram.
            </p>
          </div>

        </header>

        <div className="mb-6">
          <div className="rounded-lg border border-border/70 bg-card/90 p-4 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Dia da semana</label>
              <div className="flex items-center gap-1">
                {WEEKDAYS.map((label, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleWeekday(idx)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md border transition-all cursor-pointer ${
                      selectedWeekdays.has(idx)
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-card text-muted-foreground border-border hover:border-ring hover:text-foreground hover:shadow-sm'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Busca</label>
                <div className="relative">
                  <MagnifyingGlassIcon size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Origem ou destino..."
                    value={q}
                    onChange={(e) => setFilters({ q: e.target.value || undefined })}
                    className="h-8 w-40 rounded-md border border-border bg-card pl-8 pr-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 placeholder:text-muted-foreground/60"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Status</label>
                <select
                  value={statuses[0] ?? ''}
                  onChange={(e) => setFilters({ statuses: e.target.value || undefined })}
                  className="h-8 rounded-md border border-border bg-card px-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 min-w-[130px]"
                >
                  <option value="">Todos os status</option>
                  {TRIP_STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Período</label>
                <select
                  value={dias}
                  onChange={(e) => setFilters({ dias: e.target.value })}
                  className="h-8 rounded-md border border-border bg-card px-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 min-w-[130px]"
                >
                  <option value="30">Últimos 30 dias</option>
                  <option value="7">Últimos 7 dias</option>
                  <option value="15">Últimos 15 dias</option>
                  <option value="month">Este mês</option>
                  <option value="90">Últimos 90 dias</option>
                  <option value="all">Todos</option>
                </select>
              </div>

              {(selectedWeekdays.size > 0 || statuses.length > 0 || dias !== '30') && (
                <button
                  type="button"
                  onClick={() => setFilters({ weekdays: undefined, statuses: undefined, dias: undefined })}
                  className="h-8 px-3 text-xs font-semibold rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 items-center gap-3 rounded-md border border-primary/20 bg-card px-4 py-2.5 shadow-lg">
            <span className="text-sm font-semibold text-foreground">
              {selectedIds.size} {selectedIds.size === 1 ? 'viagem selecionada' : 'viagens selecionadas'}
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <Button size="sm" onClick={handlePrintSelected} className="cursor-pointer">
                <Printer size={14} className="mr-1" />
                Imprimir relatório
              </Button>
              <Button variant="ghost" size="sm" onClick={clearSelection} className="cursor-pointer">
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {!isLoading && !error && (
          <div className="mb-6 text-sm font-semibold text-foreground">
            {filteredTrips.length} {filteredTrips.length === 1 ? 'viagem encontrada' : 'viagens encontradas'}
          </div>
        )}

        {error ? (
          <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700">
            Não foi possível carregar as viagens. Verifique se você tem permissão para acessar este recurso.
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            Carregando viagens...
          </div>
        ) : !error && filteredTrips.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            {trips && trips.length > 0
              ? 'Nenhuma viagem passada corresponde aos filtros selecionados.'
              : 'Nenhuma viagem no histórico.'}
          </div>
        ) : !error && groupedHistoryTrips.length > 0 ? (
          <section className="space-y-8">
            {groupedHistoryTrips.map((group) => (
              <div key={group.date}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                  <h3 className="text-sm font-semibold tracking-wider text-foreground uppercase">
                    {group.label.toUpperCase()}
                  </h3>
                  <span className="inline-flex items-center justify-center min-w-5 h-5 rounded-full bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">
                    {group.trips.length}
                  </span>
                </div>
                <TripTable
                  trips={group.trips}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  onToggleAll={handleToggleAll}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  showCheckboxes
                  showDateColumn={false}
                />
              </div>
            ))}
          </section>
        ) : null}
      </section>

      <Dialog open={isEditOpen} onOpenChange={(open) => { if (!open) { setIsEditOpen(false); setEditingTrip(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar viagem</DialogTitle>
          </DialogHeader>
          {editingTrip && (
            <TripForm
              tripValues={editingTrip}
              onSuccess={() => { setIsEditOpen(false); setEditingTrip(null) }}
            />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
