import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { Button } from "@/lib/ui/button"
import { ConfirmDeleteDialog } from '@/lib/ui/delete-alert'
import { TrashIcon, ArrowsClockwise, CalendarCheck, CaretDown, CaretRight } from "@phosphor-icons/react"

import { AdminLayout } from '@/features/admin/ui/Layout'
import { usePenaltiesGrouped, useUpdatePenalty, useDeletePenalty } from '@/features/admin/hooks/usePenalties'
import type { PenaltyFilters } from '@/features/admin/services/penalties'

const STATUS_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'true', label: 'Ativas' },
  { value: 'false', label: 'Cumpridas' },
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

export function PenaltiesPage() {
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [isActiveFilter, setIsActiveFilter] = useState('')
  const [periodDays, setPeriodDays] = useState('30')
  const [weekdays, setWeekdays] = useState<Set<number>>(new Set())
  const [expandedTripId, setExpandedTripId] = useState<number | null>(null)

  const filters: PenaltyFilters = useMemo(() => {
    const f: PenaltyFilters = {}
    if (search.trim()) f.q = search.trim()
    if (isActiveFilter) f.is_active = isActiveFilter
    if (periodDays !== 'all') {
      const to = new Date()
      const from = new Date()
      from.setDate(from.getDate() - Number(periodDays))
      f.date_from = formatDate(from)
      f.date_to = formatDate(to)
    }
    return f
  }, [search, isActiveFilter, periodDays])

  const { data: groups = [], isLoading, isError } = usePenaltiesGrouped(filters)
  const updateMutation = useUpdatePenalty()
  const deleteMutation = useDeletePenalty()

  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      if (weekdays.size > 0 && !weekdays.has(getDayOfWeek(g.trip_date))) return false
      return true
    })
  }, [groups, weekdays])

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
    return weekdays.size > 0 || periodDays !== '30' || search.trim() !== '' || isActiveFilter !== ''
  }

  function clearFilters() {
    setSearch('')
    setIsActiveFilter('')
    setPeriodDays('30')
    setWeekdays(new Set())
  }

  const handleToggle = (item: { id: number; is_active: boolean }) => {
    updateMutation.mutate({ id: item.id, data: { is_active: !item.is_active } })
  }

  return (
    <AdminLayout>
      <section className="mx-auto w-full max-w-5xl px-4 py-6 space-y-6">
        <header>
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
            Gestão
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight mt-1">
            Penalidades
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as penalidades aplicadas aos estudantes.
          </p>
        </header>

        {!isLoading && !isError && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Busca</label>
                <input
                  type="text"
                  placeholder="Nome, matrícula ou descrição..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 w-60 rounded-md border border-border bg-card px-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 placeholder:text-muted-foreground/60"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Status</label>
                <select
                  value={isActiveFilter}
                  onChange={(e) => setIsActiveFilter(e.target.value)}
                  className="h-8 rounded-md border border-border bg-card px-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                >
                  {STATUS_OPTIONS.map((o) => (
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
            Carregando penalidades...
          </div>
        ) : isError ? (
          <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Erro ao carregar penalidades. Verifique sua conexão e tente novamente.
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center">
            <CalendarCheck size={48} className="mx-auto text-muted-foreground/40 mb-4" weight="light" />
            <p className="text-sm text-muted-foreground">Nenhuma penalidade encontrada.</p>
          </div>
        ) : (
          <section className="space-y-8">
            {groupedByDate.map((group) => (
              <div key={group.date}>
                <h3 className="text-xs font-semibold text-foreground mb-2">
                  {group.label} · {group.trips.length} {group.trips.length === 1 ? 'viagem' : 'viagens'}
                </h3>
                <div className="rounded-lg border border-border/70 bg-card/90 overflow-hidden">
                  <div className="hidden md:grid md:grid-cols-[70px_80px_1fr_80px] md:px-5 md:py-2 md:bg-muted/40 md:text-[11px] md:font-semibold md:tracking-wider md:text-muted-foreground md:uppercase md:border-b md:border-border/50">
                    <span>Horário</span>
                    <span className="text-center">ID</span>
                    <span>Rota</span>
                    <span />
                  </div>
                  <div className="divide-y divide-border/50">
                    {group.trips.map((trip) => (
                      <div key={trip.trip_id}>
                        <div
                          className="flex flex-col gap-1 px-5 py-3 text-sm transition-colors hover:bg-muted/30 md:grid md:grid-cols-[70px_80px_1fr_80px] md:items-center cursor-pointer"
                          onClick={() => setExpandedTripId(expandedTripId === trip.trip_id ? null : trip.trip_id)}
                        >
                          <span className="font-mono text-xs text-muted-foreground">{trip.departure_time}</span>
                          <span
                            className="font-mono text-xs text-muted-foreground underline underline-offset-2 decoration-dotted decoration-muted-foreground/40 hover:text-foreground hover:decoration-foreground/60 text-center cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); navigate({ to: '/admin/viagens/$id', params: { id: String(trip.trip_id) } }) }}
                          >
                            {trip.trip_id}
                          </span>
                          <span className="font-medium truncate">{trip.route}</span>
                          <span className="flex items-center justify-end text-muted-foreground">
                            {expandedTripId === trip.trip_id ? <CaretDown size={16} weight="bold" /> : <CaretRight size={16} weight="bold" />}
                            <span className="text-xs ml-1">{trip.punishment_count}</span>
                          </span>
                        </div>

                        {expandedTripId === trip.trip_id && (
                          <div className="border-t border-border/50 bg-muted/20">
                            {trip.punishments.length === 0 ? (
                              <div className="px-5 py-4 text-xs text-muted-foreground text-center">
                                Nenhuma penalidade para esta viagem com os filtros atuais.
                              </div>
                            ) : (
                              <div className="divide-y divide-border/50">
                                <div className="hidden md:grid md:grid-cols-[50px_1fr_90px_1fr_90px_70px_60px] md:px-8 md:py-1.5 md:text-[10px] md:font-semibold md:tracking-wider md:text-muted-foreground md:uppercase">
                                  <span>ID</span>
                                  <span>Estudante</span>
                                  <span>Matrícula</span>
                                  <span>Descrição</span>
                                  <span>Criada em</span>
                                  <span className="text-center">Status</span>
                                  <span className="text-right" />
                                </div>
                                {trip.punishments.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex flex-col gap-1 px-8 py-2.5 text-sm transition-colors hover:bg-muted/30 md:grid md:grid-cols-[50px_1fr_90px_1fr_90px_70px_60px] md:items-center"
                                  >
                                    <span className="font-mono text-xs text-muted-foreground">{item.id}</span>
                                    <span className="font-medium truncate">{item.student_name}</span>
                                    <span className="font-mono text-xs text-muted-foreground">{item.student_id_display}</span>
                                    <span className="text-muted-foreground text-xs md:text-sm truncate">{item.description}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {item.created_at ? new Date(item.created_at + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                                    </span>
                                    <div className="flex justify-center">
                                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border inline-block ${
                                        item.is_active
                                          ? 'bg-red-100 text-red-700 border-red-200'
                                          : 'bg-gray-100 text-gray-600 border-gray-200'
                                      }`}>
                                        {item.is_active ? 'Ativa' : 'Cumprida'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 justify-end">
                                      <button
                                        type="button"
                                        onClick={() => handleToggle(item)}
                                        disabled={updateMutation.isPending}
                                        className="inline-flex items-center justify-center p-1.5 rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
                                        title={item.is_active ? 'Marcar como cumprida' : 'Reativar penalidade'}
                                      >
                                        <ArrowsClockwise size={14} />
                                      </button>
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
      </section>
    </AdminLayout>
  )
}
