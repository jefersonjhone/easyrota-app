import { useEffect, useState, useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { Button } from '@ui/button'
import { apiFetch } from '@/lib/api'
import { PeriodFilter, type Period } from '@/components/trips/PeriodFilter'
import { formatTripDate, getStatusTone } from '@/features/user-home/config'

interface TripReservation {
  id: string
  origin: string
  destiny: string
  trip_date: string
  trip_history_status: 'PENDENTE' | 'CONCLUÍDA' | 'CANCELADA' | 'FALTA'
  reservation_status: 'PENDENTE' | 'CONFIRMADA' | 'LISTA SECUNDÁRIA'
  can_cancel: boolean
  quorum_met: boolean
  created_at: string
}

const statusLabel: Record<string, string> = {
  'CONCLUÍDA': 'Concluída',
  CONCLUIDA: 'Concluída',
  PENDENTE: 'Em espera',
  FALTA: 'Falta',
  CANCELADA: 'Cancelada',
}

const FILTER_OPTIONS = ['Todas', 'CONCLUÍDA', 'FALTA', 'CANCELADA'] as const

function getWeekRange(offset: number): { start: Date; end: Date } {
  const now = new Date()
  const day = now.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMonday + offset * 7)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { start: monday, end: sunday }
}

function getMonthRange(offset: number): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  start.setHours(0, 0, 0, 0)
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

function parseISODate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00`)
}

function getWeekdayFromISO(dateStr: string): number {
  return parseISODate(dateStr).getDay()
}

export function TripsHistoryPage() {
  const [trips, setTrips] = useState<TripReservation[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelingId, setCancelingId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<string>('Todas')

  const [period, setPeriod] = useState<Period>('week')
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [weekOffset, setWeekOffset] = useState(0)
  const [monthOffset, setMonthOffset] = useState(0)

  useEffect(() => {
    apiFetch<TripReservation[]>('/reservations/history/')
      .then(setTrips)
      .catch((err) => console.error('Erro ao buscar histórico:', err))
      .finally(() => setLoading(false))
  }, [])

  const availableWeekdays = useMemo(() => [1, 2, 3, 4, 5], [])

  const filteredTrips = useMemo(() => {
    let result = trips

    if (activeFilter !== 'Todas') {
      result = result.filter((t) => t.trip_history_status === activeFilter)
    }

    if (period === 'week') {
      const { start, end } = getWeekRange(weekOffset)
      result = result.filter((r) => {
        const d = parseISODate(r.trip_date)
        return d >= start && d <= end
      })
    }

    if (period === 'month') {
      const { start, end } = getMonthRange(monthOffset)
      result = result.filter((r) => {
        const d = parseISODate(r.trip_date)
        return d >= start && d <= end
      })
    }

    if (selectedDays.length > 0) {
      result = result.filter((r) => selectedDays.includes(getWeekdayFromISO(r.trip_date)))
    }

    return result
  }, [trips, activeFilter, period, selectedDays, weekOffset, monthOffset])

  const handleCancel = async (reservationId: string) => {
    setCancelingId(reservationId)
    try {
      await apiFetch(`/reservations/manage/${reservationId}/cancel/`, {
        method: 'POST',
      })
      const data = await apiFetch<TripReservation[]>('/reservations/history/')
      setTrips(data)
    } catch (err) {
      console.error('Erro ao cancelar reserva:', err)
    } finally {
      setCancelingId(null)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 mt-8">
        <div className="rounded-4xl border border-dashed border-border bg-muted/30 p-4 md:p-8 text-center text-xs md:text-sm text-muted-foreground">
          Carregando histórico...
        </div>
      </div>
    )
  }

  return (
    <section className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 mt-8">
      <div className="mb-5 md:mb-8 space-y-1.5 md:space-y-2">
        <span className="inline-flex w-fit rounded-full bg-primary/10 px-2.5 py-0.5 md:px-3 md:py-1 text-[10px] md:text-xs font-semibold tracking-[0.2em] text-primary uppercase">
          Histórico
        </span>
        <h1 className="font-heading text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight">
          Histórico de viagens
        </h1>
        <p className="max-w-2xl text-xs md:text-sm lg:text-base leading-relaxed text-muted-foreground">
          Todas as reservas realizadas anteriormente, incluindo concluídas e canceladas.
        </p>
      </div>

      {trips.length === 0 ? (
        <div className="rounded-4xl border border-dashed border-border bg-muted/30 p-4 md:p-8 text-center">
          <div className="space-y-3 md:space-y-4">
            <div>
              <h3 className="text-sm md:text-lg font-semibold">Nenhum histórico</h3>
              <p className="mt-1.5 md:mt-2 text-xs md:text-sm leading-relaxed text-muted-foreground">
                Você ainda não realizou nenhuma viagem pelo sistema.
              </p>
            </div>
            <Link to="/app/viagens">
              <Button size="sm" className="md:default">Explorar viagens disponíveis</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <PeriodFilter
            period={period}
            onPeriodChange={setPeriod}
            selectedDays={selectedDays}
            onDaysChange={setSelectedDays}
            weekOffset={weekOffset}
            onWeekOffsetChange={setWeekOffset}
            monthOffset={monthOffset}
            onMonthOffsetChange={setMonthOffset}
            availableWeekdays={availableWeekdays}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-semibold text-foreground/80">
              {filteredTrips.length}{' '}
              {filteredTrips.length === 1 ? 'viagem encontrada' : 'viagens encontradas'}
            </div>

            <div className="flex flex-wrap gap-2">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setActiveFilter(opt)}
                  className={`rounded-full px-3 md:px-4 py-1.5 md:py-2 text-[11px] md:text-sm font-semibold tracking-wide transition-colors ${
                    activeFilter === opt
                      ? 'bg-primary text-primary-foreground'
                      : opt === 'Todas'
                        ? 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                        : opt === 'CONCLUÍDA'
                          ? 'bg-muted text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-700'
                          : opt === 'FALTA'
                            ? 'bg-muted text-muted-foreground hover:bg-rose-500/10 hover:text-rose-700'
                            : 'bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
                  }`}
                >
                  {opt === 'Todas' ? 'Todas' : statusLabel[opt] || opt}
                </button>
              ))}
            </div>
          </div>

          {filteredTrips.length === 0 ? (
            <div className="rounded-4xl border border-dashed border-border bg-muted/30 p-4 md:p-8 text-center text-xs md:text-sm text-muted-foreground">
              Nenhuma viagem encontrada para este filtro.
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {filteredTrips.map((trip, index) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.04,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <Link
                    to="/app/viagens/$id"
                    params={{ id: trip.id }}
                    className="block rounded-4xl border border-border/70 bg-card/95 px-4 md:px-6 py-3 md:py-5 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex flex-col gap-3 md:gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1.5 md:space-y-2 flex-1">
                        <div className="flex items-start justify-between gap-2 md:gap-4">
                          <div className="min-w-0">
                            <p className="font-heading text-sm md:text-lg font-semibold tracking-tight">
                              {trip.origin} &rarr; {trip.destiny}
                            </p>
                            <p className="mt-0.5 md:mt-1 text-xs md:text-sm text-muted-foreground">
                              {formatTripDate(trip.trip_date)}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 inline-flex rounded-full px-2 md:px-3 py-0.5 md:py-1 text-[10px] md:text-xs font-semibold tracking-wide uppercase ring-1 ${getStatusTone(trip.trip_history_status)}`}
                          >
                            {statusLabel[trip.trip_history_status] || trip.trip_history_status}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 md:gap-2 pt-0.5 md:pt-1">
                          <span className="rounded-full bg-muted px-2 md:px-3 py-0.5 md:py-1 text-[10px] md:text-xs text-muted-foreground">
                            Reserva: {trip.reservation_status}
                          </span>
                          <span className="rounded-full bg-muted px-2 md:px-3 py-0.5 md:py-1 text-[10px] md:text-xs text-muted-foreground">
                            Quórum: {trip.quorum_met ? 'atingido' : 'pendente'}
                          </span>
                        </div>
                      </div>

                      {trip.can_cancel && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 border-destructive/20 shrink-0"
                          onClick={(e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); handleCancel(trip.id) }}
                          disabled={cancelingId === trip.id}
                        >
                          {cancelingId === trip.id ? 'Cancelando...' : 'Cancelar'}
                        </Button>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
