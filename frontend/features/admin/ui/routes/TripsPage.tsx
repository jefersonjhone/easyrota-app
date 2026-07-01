import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  useBulkDeleteTrips,
  useDeleteTrip,
  useTrips,
} from '@/features/trips/hooks/useTrips'
import type { Trip, TripStatus } from '@/features/trips/types'
import { Button } from '@ui/button'
import { ConfirmDeleteDialog } from '@ui/delete-alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@ui/dialog'
import { AdminLayout } from '@/features/admin/ui/Layout'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { MagnifyingGlassIcon, PlusIcon, TrashIcon, CalendarBlank } from '@phosphor-icons/react'
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

export function TripsPage() {
  const navigate = useNavigate()
  const { statuses = [], q = '', dias = '7' } = useSearch({ from: '/admin/viagens/' })

  const selectedStatuses = useMemo(() => new Set(statuses), [statuses])

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])
  const todayStr = today.toISOString().split('T')[0]

  const maxDate = useMemo(() => {
    if (dias === 'all') return null
    if (dias === '1') return todayStr
    if (dias === 'month') {
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      return lastDay.toISOString().split('T')[0]
    }
    const d = new Date(todayStr + 'T12:00:00')
    d.setDate(d.getDate() + Number(dias))
    return d.toISOString().split('T')[0]
  }, [dias, todayStr, today])

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const { data: trips, isLoading, error } = useTrips()
  const deleteMutation = useDeleteTrip()
  const bulkDeleteMutation = useBulkDeleteTrips()

  function setFilters(partial: Record<string, string | undefined>) {
    navigate({
      from: '/admin/viagens/',
      search: (prev) => {
        const current: Record<string, string> = {}
        if (prev.statuses?.length) current.statuses = prev.statuses.join(',')
        if (prev.q) current.q = prev.q
        if (prev.dias && prev.dias !== '7') current.dias = prev.dias
        const merged = { ...current, ...partial }
        const clean: Record<string, string> = {}
        if (merged.statuses) clean.statuses = merged.statuses
        if (merged.q) clean.q = merged.q
        if (merged.dias && merged.dias !== '7') clean.dias = merged.dias
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
        if (trip.trip_date < todayStr) return false
        if (selectedStatuses.size > 0 && !selectedStatuses.has(trip.status)) {
          return false
        }
        if (maxDate && trip.trip_date > maxDate) return false
        if (qLower && !trip.origin.toLowerCase().includes(qLower) && !trip.destiny.toLowerCase().includes(qLower)) {
          return false
        }
        return true
      })
      .sort((a, b) => {
        const dateCmp = a.trip_date.localeCompare(b.trip_date)
        if (dateCmp !== 0) return dateCmp
        return a.departure_time.localeCompare(b.departure_time)
      })
  }, [trips, selectedStatuses, q, todayStr, maxDate])

  const todayTrips = useMemo(() =>
    filteredTrips.filter(t => t.trip_date === todayStr),
    [filteredTrips, todayStr],
  )

  const upcomingTrips = useMemo(() => {
    const dateMap: Record<string, Trip[]> = {}
    for (const trip of filteredTrips) {
      if (trip.trip_date <= todayStr) continue
      if (!dateMap[trip.trip_date]) dateMap[trip.trip_date] = []
      dateMap[trip.trip_date].push(trip)
    }
    return Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, trips]) => {
        const d = new Date(date + 'T12:00:00')
        const dayName = DAY_NAMES_LONG[d.getDay()]
        const [year, m, day] = date.split('-')
        return { date, label: `${dayName}, ${day}/${m}/${year}`, trips }
      })
  }, [filteredTrips, todayStr])

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleToggleAll(ids: string[], select: boolean) {
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

  function handleBatchDelete() {
    bulkDeleteMutation.mutate([...selectedIds], {
      onSuccess: () => { toast.success('Viagens removidas com sucesso!'); clearSelection() },
    })
  }

  function openEdit(trip: Trip) {
    setEditingTrip(trip)
    setIsEditOpen(true)
  }

  function handleDelete(id: string) {
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
            <div className="flex items-center gap-2">
              <CalendarBlank size={20} className="text-primary shrink-0" />
              <h1 className="font-heading text-3xl font-semibold tracking-tight">
                Viagens
              </h1>
            </div>
            <p className="text-muted-foreground">
              Acompanhe e gerencie todas as viagens.
            </p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="shrink-0 mt-2 cursor-pointer">
                <PlusIcon className="mr-1.5" weight="bold" size={16} />
                Nova viagem
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar viagem</DialogTitle>
              </DialogHeader>
              <TripForm onSuccess={() => setIsCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </header>

        <div className="mb-6">
          <div className="rounded-lg border border-border/70 bg-card/90 p-4 space-y-4">
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
                  className="h-8 w-full md:w-40 rounded-md border border-border bg-card pl-8 pr-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 placeholder:text-muted-foreground/60"
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
                <option value="1">Hoje</option>
                <option value="7">Próximos 7 dias</option>
                <option value="15">Próximos 15 dias</option>
                <option value="month">Este mês</option>
                <option value="30">Próximos 30 dias</option>
                <option value="all">Todas viagens agendadas</option>
              </select>
            </div>

            {(statuses.length > 0 || dias !== '7') && (
              <button
                type="button"
                onClick={() => setFilters({ statuses: undefined, dias: undefined })}
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
              <ConfirmDeleteDialog
                onConfirm={handleBatchDelete}
                trigger={
                  <Button variant="destructive" size="sm" className="cursor-pointer">
                    <TrashIcon size={14} className="mr-1" />
                    Deletar selecionadas
                  </Button>
                }
              />
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
              ? 'Nenhuma viagem corresponde aos filtros selecionados.'
              : 'Nenhuma viagem cadastrada ainda.'}
          </div>
        ) : null}

        {todayTrips.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center gap-3 mb-3">
              <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
              <h2 className="text-sm font-semibold tracking-wider text-foreground uppercase">
                HOJE · {todayStr.split('-').reverse().join('/')}
              </h2>
              <span className="inline-flex items-center justify-center min-w-5 h-5 rounded-full bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">
                {todayTrips.length}
              </span>
            </div>
            <TripTable
              trips={todayTrips}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onToggleAll={handleToggleAll}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          </section>
        )}

        {upcomingTrips.length > 0 && (
          <section className="mt-10 space-y-8">
            <h2 className="text-sm font-semibold tracking-wider text-foreground uppercase">Próximos dias</h2>
            {upcomingTrips.map((group) => (
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
                />
              </div>
            ))}
          </section>
        )}
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
