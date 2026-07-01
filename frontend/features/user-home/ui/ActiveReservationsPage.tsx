import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { Button } from '@ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@ui/dialog'
import { ArrowRight, CalendarCheck } from '@phosphor-icons/react'
import { PeriodFilter, type Period } from '@/components/trips/PeriodFilter'
import { formatTripDate } from '../config'
import { fetchActiveReservations, cancelReservation } from '../services/reservations'
import type { ActiveReservation } from '../types'

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

export function ActiveReservationsPage() {
  const [reservations, setReservations] = useState<ActiveReservation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const [period, setPeriod] = useState<Period>('week')
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [weekOffset, setWeekOffset] = useState(0)
  const [monthOffset, setMonthOffset] = useState(0)

  useEffect(() => {
    fetchActiveReservations()
      .then(setReservations)
      .catch((err) => {
        const data = err as { data?: { detail?: string } }
        setError(data?.data?.detail || 'Não foi possível carregar as reservas.')
      })
      .finally(() => setIsLoading(false))
  }, [])

  const availableWeekdays = useMemo(() => [1, 2, 3, 4, 5], [])

  const filteredReservations = useMemo(() => {
    let result = [...reservations]

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
  }, [reservations, period, selectedDays, weekOffset, monthOffset])

  const handleCancel = async (id: string) => {
    try {
      await cancelReservation(id)
      setReservations((prev) => prev.filter((r) => r.id !== id))
    } catch {
      // silent
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <section className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 mt-8">
      <div className="mb-6 md:mb-8 space-y-1.5 md:space-y-2">
        <span className="inline-flex w-fit rounded-full bg-primary/10 px-2.5 py-0.5 md:px-3 md:py-1 text-[10px] md:text-xs font-semibold tracking-[0.2em] text-primary uppercase">
          Minhas reservas
        </span>
        <div className="flex items-center gap-2">
          <CalendarCheck size={24} className="text-primary shrink-0" />
          <h1 className="font-heading text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight">
            Reservas ativas
          </h1>
        </div>
        <p className="max-w-2xl text-xs md:text-sm lg:text-base leading-relaxed text-muted-foreground">
          Acompanhe suas reservas futuras, acesse o QR code de embarque e gerencie
          acompanhantes.
        </p>
      </div>

      {error && (
        <div className="rounded-3xl bg-destructive/10 px-4 py-3 text-sm text-destructive mb-6">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-4 md:p-6 text-xs md:text-sm text-muted-foreground">
          Carregando reservas ativas...
        </div>
      ) : reservations.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-4 md:p-6 text-center">
          <div className="space-y-3 md:space-y-4">
            <div>
              <h3 className="text-sm md:text-lg font-semibold">Nenhuma reserva ativa</h3>
              <p className="mt-1.5 md:mt-2 text-xs md:text-sm leading-relaxed text-muted-foreground">
                Você ainda não possui reservas para viagens futuras.
              </p>
            </div>
            <Link to="/app/viagens">
              <Button size="sm">Explorar viagens disponíveis</Button>
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

          <div className="text-sm font-semibold text-foreground/80">
            {filteredReservations.length}{' '}
            {filteredReservations.length === 1
              ? 'reserva encontrada'
              : 'reservas encontradas'}
          </div>

          {filteredReservations.length === 0 && reservations.length > 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhuma reserva encontrada para este período.
              </p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                Tente selecionar outra semana ou mês.
              </p>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {filteredReservations.map((reservation, index) => {
                const occupied = reservation.kind === 'STUDENT'
                  ? reservation.trip_students_count + reservation.trip_servants_count + reservation.trip_guests_count
                  : reservation.trip_servants_count + reservation.trip_guests_count
                const total = occupied + reservation.available_seats

                return (
                  <motion.div
                    key={reservation.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.04,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <div
                      className="rounded-3xl border border-border/70 bg-card/90 px-3 md:px-4 py-3 md:py-5 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="flex flex-col gap-3 md:gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <h2 className="font-heading text-base md:text-2xl font-medium tracking-tight">
                            {reservation.origin} &rarr; {reservation.destiny}
                          </h2>
                          <p className="mt-0.5 md:mt-1 text-xs md:text-sm text-muted-foreground">
                            {reservation.status_trip}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 md:gap-3 self-end sm:self-auto">
                          <span
                            className={`rounded-full px-2 md:px-3 py-0.5 md:py-1 text-[10px] md:text-xs font-semibold tracking-wide uppercase ${
                              reservation.reservation_status === 'CONFIRMADA'
                                ? 'bg-primary/12 text-primary'
                                : reservation.reservation_status === 'LISTA SECUNDÁRIA'
                                  ? 'bg-amber-500/12 text-amber-700'
                                  : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {reservation.reservation_status === 'CONFIRMADA'
                              ? 'Confirmada'
                              : reservation.reservation_status === 'LISTA SECUNDÁRIA'
                                ? 'Lista secundária'
                                : 'Pendente'}
                          </span>

                          <Link to="/app/reservas/$id" params={{ id: reservation.id }}>
                            <Button size="sm">
                              Detalhes
                              <ArrowRight size={14} className="md:size-[16px]" />
                            </Button>
                          </Link>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 md:gap-3 mt-3 md:mt-4">
                        <div className="rounded-3xl bg-muted/30 p-2 md:p-3">
                          <p className="text-[9px] md:text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">Data</p>
                          <p className="mt-0.5 md:mt-1.5 text-xs md:text-base font-semibold">{formatTripDate(reservation.trip_date)}</p>
                        </div>
                        <div className="rounded-3xl bg-muted/30 p-2 md:p-3">
                          <p className="text-[9px] md:text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">Hora</p>
                          <p className="mt-0.5 md:mt-1.5 text-xs md:text-base font-semibold">{reservation.departure_time}</p>
                        </div>
                        <div className="rounded-3xl bg-muted/30 p-2 md:p-3">
                          <p className="text-[9px] md:text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">Reservas</p>
                          <p className="mt-0.5 md:mt-1.5 text-xs md:text-base font-semibold">{occupied}/{total}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 md:gap-2 mt-3 md:mt-4">
                        {reservation.trip_students_count > 0 && (
                          <span className="rounded-full bg-muted px-2 md:px-3 py-0.5 md:py-1 text-[10px] md:text-xs text-muted-foreground">
                            {reservation.trip_students_count} aluno{reservation.trip_students_count !== 1 ? 's' : ''}
                          </span>
                        )}
                        {reservation.trip_servants_count > 0 && (
                          <span className="rounded-full bg-muted px-2 md:px-3 py-0.5 md:py-1 text-[10px] md:text-xs text-muted-foreground">
                            {reservation.trip_servants_count} servidor{reservation.trip_servants_count !== 1 ? 'es' : ''}
                          </span>
                        )}
                        {reservation.trip_guests_count > 0 && (
                          <span className="rounded-full bg-muted px-2 md:px-3 py-0.5 md:py-1 text-[10px] md:text-xs text-muted-foreground">
                            {reservation.trip_guests_count} convidado{reservation.trip_guests_count !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {reservation.can_cancel && (
                        <div className="mt-3 md:mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10 border-destructive/20"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCancellingId(reservation.id) }}
                          >
                            Cancelar reserva
                          </Button>
                        </div>
                      )}

                      <Dialog
                        open={cancellingId === reservation.id}
                        onOpenChange={(open) => { if (!open) setCancellingId(null) }}
                      >
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Cancelar reserva</DialogTitle>
                            <DialogDescription>
                              Tem certeza que deseja cancelar esta reserva? Esta ação não pode ser desfeita.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setCancellingId(null)}>
                              Manter reserva
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleCancel(reservation.id)}
                            >
                              Sim, cancelar
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
