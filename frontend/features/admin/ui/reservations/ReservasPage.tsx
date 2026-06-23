import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { Button } from "@/lib/ui/button"
import { ConfirmDeleteDialog } from '@/lib/ui/delete-alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@ui/dialog'
import { Check, X, Minus, MagnifyingGlassIcon, TrashIcon, CalendarCheck, CaretDown, CaretRight, PencilSimpleIcon } from "@phosphor-icons/react"

import { AdminLayout } from '@/features/admin/ui/Layout'
import { useReservationsGrouped, useUpdateReservation, useDeleteReservation } from '@/features/admin/hooks/useReservations'
import type { Reservation, ReservationFilters } from '@/features/admin/services/reservations'

const STATUS_STYLES: Record<string, string> = {
  PENDENTE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMADA: 'bg-blue-100 text-blue-800 border-blue-200',
  'LISTA SECUNDÁRIA': 'bg-gray-100 text-gray-800 border-gray-200',
}

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'CONFIRMADA', label: 'Confirmada' },
  { value: 'LISTA SECUNDÁRIA', label: 'Lista Secundária' },
]

const PASSENGER_TYPE_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'ESTUDANTE', label: 'Estudante' },
  { value: 'SERVIDOR', label: 'Servidor' },
  { value: 'CONVIDADO', label: 'Convidado' },
]

const PERIOD_OPTIONS = [
  { label: 'Últimos 7 dias', value: '7' },
  { label: 'Últimos 15 dias', value: '15' },
  { label: 'Últimos 30 dias', value: '30' },
  { label: 'Todas', value: 'all' },
]

const DAY_NAMES_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const DAY_NAMES_LONG = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr + 'T12:00:00').getDay()
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function formatDateBR(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function ReservasPage() {
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [passengerTypeFilter, setPassengerTypeFilter] = useState('')
  const [periodDays, setPeriodDays] = useState('7')
  const [weekdays, setWeekdays] = useState<Set<number>>(new Set())
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const filters: ReservationFilters = useMemo(() => {
    const f: ReservationFilters = {}
    if (search.trim()) f.q = search.trim()
    if (statusFilter) f.status = statusFilter
    if (passengerTypeFilter) f.passenger_type = passengerTypeFilter
    if (periodDays !== 'all') {
      const to = new Date()
      const from = new Date()
      from.setDate(from.getDate() - Number(periodDays))
      f.date_from = formatDate(from)
      f.date_to = formatDate(to)
    }
    return f
  }, [search, statusFilter, passengerTypeFilter, periodDays])

  const [editReservation, setEditReservation] = useState<Reservation | null>(null)

  const { data: groups = [], isLoading, isError } = useReservationsGrouped(filters)
  const updateMutation = useUpdateReservation()
  const deleteMutation = useDeleteReservation()

  const filteredGroups = useMemo(() => {
    const qLower = search.toLowerCase().trim()
    return groups.filter((g) => {
      if (weekdays.size > 0 && !weekdays.has(getDayOfWeek(g.trip_date))) return false
      if (qLower && !g.route.toLowerCase().includes(qLower)) return false
      return true
    })
  }, [groups, weekdays, search])

  const groupedByDate = useMemo(() => {
    const map: Record<string, typeof filteredGroups> = {}
    for (const g of filteredGroups) {
      if (!map[g.trip_date]) map[g.trip_date] = []
      map[g.trip_date].push(g)
    }
    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, trips]) => {
        const d = new Date(date + 'T12:00:00')
        const [year, m, day] = date.split('-')
        return { date, label: `${DAY_NAMES_LONG[d.getDay()]}, ${day}/${m}/${year}`, trips }
      })
  }, [filteredGroups])

  function toggleWeekday(day: number) {
    const next = new Set(weekdays)
    if (next.has(day)) next.delete(day)
    else next.add(day)
    setWeekdays(next)
  }

  function hasActiveFilters() {
    return weekdays.size > 0 || periodDays !== '7' || search.trim() !== '' || statusFilter !== '' || passengerTypeFilter !== ''
  }

  function clearFilters() {
    setSearch('')
    setStatusFilter('')
    setPassengerTypeFilter('')
    setPeriodDays('7')
    setWeekdays(new Set())
  }

  const passengerBadge = (type: string) => {
    const styles: Record<string, string> = {
      ESTUDANTE: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      SERVIDOR: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      CONVIDADO: 'bg-orange-100 text-orange-700 border-orange-200',
    }
    return (
      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${styles[type] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
        {type === 'ESTUDANTE' ? 'Est' : type === 'SERVIDOR' ? 'Serv' : 'Conv'}
      </span>
    )
  }

  return (
    <AdminLayout>
      <section className="mx-auto w-full max-w-5xl px-4 py-6 space-y-6">
        <header>
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
            Usuários e Reservas
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight mt-1">
            Reservas
          </h1>
        </header>

        {!isLoading && !isError && (
          <div className="rounded-lg border border-border/70 bg-card/90 p-4 space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Busca</label>
                <div className="relative">
                  <MagnifyingGlassIcon size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Nome do passageiro ou rota..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 w-48 rounded-md border border-border bg-card pl-8 pr-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 placeholder:text-muted-foreground/60"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8 rounded-md border border-border bg-card px-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Passageiro</label>
                <select
                  value={passengerTypeFilter}
                  onChange={(e) => setPassengerTypeFilter(e.target.value)}
                  className="h-8 rounded-md border border-border bg-card px-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                >
                  {PASSENGER_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Período</label>
                <select
                  value={periodDays}
                  onChange={(e) => setPeriodDays(e.target.value)}
                  className="h-8 rounded-md border border-border bg-card px-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                >
                  {PERIOD_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Dia da semana</label>
              <div className="flex items-center gap-1">
                {DAY_NAMES_SHORT.map((label, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleWeekday(idx)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md border transition-all cursor-pointer ${
                      weekdays.has(idx)
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-card text-muted-foreground border-border hover:border-ring hover:text-foreground hover:shadow-sm'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <p className="text-sm font-semibold text-foreground">
                {groups.length} viagem{groups.length !== 1 ? 'ns' : ''} encontrada{groups.length !== 1 ? 's' : ''}
              </p>
              {hasActiveFilters() && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-semibold rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300 transition-colors cursor-pointer px-3 py-1.5"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground text-center">
            Carregando reservas...
          </div>
        ) : isError ? (
          <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Erro ao carregar reservas. Verifique sua conexão e tente novamente.
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center">
            <CalendarCheck size={48} className="mx-auto text-muted-foreground/40 mb-4" weight="light" />
            <p className="text-sm text-muted-foreground">Nenhuma reserva encontrada.</p>
          </div>
        ) : (
          <section className="space-y-8">
            {groupedByDate.map((group) => (
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
                <div className="rounded-lg border border-border/70 bg-card/90 overflow-hidden">
                  <div className="hidden md:grid md:grid-cols-[70px_80px_1fr_80px_120px_50px] md:px-5 md:py-2 md:bg-muted/40 md:text-[11px] md:font-semibold md:tracking-wider md:text-muted-foreground md:uppercase md:border-b md:border-border/50">
                    <span>Horário</span>
                    <span className="text-center">ID</span>
                    <span>Rota</span>
                    <span className="text-center">Reservas</span>
                    <span className="text-center">Status</span>
                    <span />
                  </div>
                  <div className="divide-y divide-border/50">
                    {group.trips.map((trip) => (
                      <div key={trip.trip_id}>
                        <div
                          className="flex flex-col gap-1 px-5 py-3 text-sm transition-colors hover:bg-muted/30 md:grid md:grid-cols-[70px_80px_1fr_80px_120px_50px] md:items-center cursor-pointer"
                          onClick={() => setExpandedIds(prev => { const next = new Set(prev); if (next.has(trip.trip_id)) next.delete(trip.trip_id); else next.add(trip.trip_id); return next })}
                        >
                          <span className="font-mono text-xs text-muted-foreground">{trip.departure_time}</span>
                          <span
                            className="font-mono text-xs text-muted-foreground underline underline-offset-2 decoration-dotted decoration-muted-foreground/40 hover:text-foreground hover:decoration-foreground/60 text-center cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); navigate({ to: '/admin/viagens/$id', params: { id: String(trip.trip_id) } }) }}
                          >
                            {trip.trip_id}
                          </span>
                          <span className="font-medium truncate">{trip.route}</span>
                          <span className="inline-flex items-center justify-center min-w-6 h-5 rounded-full bg-primary/10 text-primary px-1.5 text-[10px] font-bold justify-self-center">
                            {trip.reservation_count}
                          </span>
                          <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-tight justify-self-center ${
                            trip.trip_status === 'CONCLUÍDA' ? 'bg-gray-100 text-gray-800 border-gray-200' :
                            trip.trip_status === 'EM ANDAMENTO' ? 'bg-green-100 text-green-800 border-green-200' :
                            trip.trip_status === 'CANCELADA' ? 'bg-red-100 text-red-800 border-red-200' :
                            'bg-blue-100 text-blue-800 border-blue-200'
                          }`}>
                            {trip.trip_status === 'RISCO DE CANCELAMENTO' ? 'Risco' : trip.trip_status}
                          </span>
                          <span className="flex items-center justify-end text-muted-foreground">
                            {expandedIds.has(trip.trip_id) ? <CaretDown size={16} weight="bold" /> : <CaretRight size={16} weight="bold" />}
                          </span>
                        </div>

                        {expandedIds.has(trip.trip_id) && (
                          <div className="border-t border-border/50 bg-muted/20">
                            {trip.reservations.length === 0 ? (
                              <div className="px-5 py-4 text-xs text-muted-foreground text-center">
                                Nenhuma reserva para esta viagem com os filtros atuais.
                              </div>
                            ) : (
                              <div className="divide-y divide-border/50">
                                <div className="hidden md:grid md:grid-cols-[60px_1fr_100px_90px_100px_70px_70px] md:px-8 md:py-1.5 md:text-[10px] md:font-semibold md:tracking-wider md:text-muted-foreground md:uppercase">
                                  <span>ID</span>
                                  <span>Passageiro</span>
                                  <span>Matrícula</span>
                                  <span className="text-center">Data</span>
                                  <span className="text-center">Status</span>
                                  <span className="text-center">Check-in</span>
                                  <span className="text-right" />
                                </div>
                                {trip.reservations.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex flex-col gap-1 px-8 py-2.5 text-sm transition-colors hover:bg-muted/30 md:grid md:grid-cols-[60px_1fr_100px_90px_100px_70px_70px] md:items-center"
                                  >
                                    <span className="font-mono text-xs text-muted-foreground">{item.id}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium truncate">{item.passenger_name}</span>
                                      {passengerBadge(item.passenger_type)}
                                    </div>
                                    <span className="font-mono text-xs text-muted-foreground">
                                      {item.passenger_id_display ?? '—'}
                                    </span>
                                    <span className="font-mono text-[10px] text-muted-foreground text-center">
                                      {formatDateBR(item.created_at)}
                                    </span>
                                    <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-tight justify-self-center ${STATUS_STYLES[item.status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                                      {item.status === 'LISTA SECUNDÁRIA' ? 'Lista Sec.' : item.status}
                                    </span>
                                    <span className="flex justify-center">
                                      {item.trip_status === 'CANCELADA' ? (
                                        <Minus size={16} className="text-muted-foreground/50" />
                                      ) : item.check_in ? (
                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                          <Check size={12} weight="bold" />
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                                          <X size={12} weight="bold" />
                                        </span>
                                      )}
                                    </span>
                                    <div className="flex items-center justify-end gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="p-1.5 h-auto text-muted-foreground hover:text-primary"
                                        onClick={() => setEditReservation(item)}
                                      >
                                        <PencilSimpleIcon size={14} />
                                      </Button>
                                      <ConfirmDeleteDialog
                                        onConfirm={() => deleteMutation.mutate(item.id)}
                                        trigger={
                                          <Button variant="ghost" size="sm" className="p-1.5 h-auto text-muted-foreground hover:text-destructive">
                                            <TrashIcon size={14} />
                                          </Button>
                                        }
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {editReservation && (
          <Dialog open={!!editReservation} onOpenChange={(open) => { if (!open) setEditReservation(null) }}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Editar Reserva</DialogTitle>
              </DialogHeader>
              <EditReservationForm
                reservation={editReservation}
                onClose={() => setEditReservation(null)}
                onSave={(id, data) => {
                  updateMutation.mutate({ id, data }, {
                    onSuccess: () => setEditReservation(null),
                  })
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </section>
    </AdminLayout>
  )
}

function EditReservationForm({
  reservation,
  onClose,
  onSave,
}: {
  reservation: Reservation
  onClose: () => void
  onSave: (id: number, data: Partial<Reservation>) => void
}) {
  const [status, setStatus] = useState(reservation.status)
  const [checkIn, setCheckIn] = useState(reservation.check_in)

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground space-y-0.5">
        <p><span className="font-semibold">Passageiro:</span> {reservation.passenger_name}</p>
        <p><span className="font-semibold">Rota:</span> {reservation.route}</p>
        <p><span className="font-semibold">Criada em:</span> {new Date(reservation.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      </div>
      <div className="space-y-1.5">
        <label className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-8 w-full rounded-md border border-border bg-card px-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          <option value="PENDENTE">Pendente</option>
          <option value="CONFIRMADA">Confirmada</option>
          <option value="LISTA SECUNDÁRIA">Lista Secundária</option>
        </select>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2.5">
        <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Check-in</label>
        <button
          type="button"
          onClick={() => setCheckIn(!checkIn)}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${checkIn ? 'bg-green-500' : 'bg-muted-foreground/30'}`}
        >
          <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform ${checkIn ? 'translate-x-4' : 'translate-x-0'}`} />
        </button>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
        <Button size="sm" onClick={() => onSave(reservation.id, { status, check_in: checkIn })}>Salvar</Button>
      </div>
    </div>
  )
}
