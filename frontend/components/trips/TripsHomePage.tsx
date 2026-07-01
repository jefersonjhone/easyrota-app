import { useMemo, useState } from 'react'
import { motion } from 'motion/react'

import AppLayout from '@layout/app-layout'
import { useAvailableTrips, useReserveTrip } from '@/features/trips/hooks/useAvailableTrips'
import { PeriodFilter, type Period } from './PeriodFilter'
import { TripCard } from './TripCard'

function parseDateBR(dateStr: string): Date {
  const [day, month, year] = dateStr.split('/')
  return new Date(Number(year), Number(month) - 1, Number(day))
}

function getWeekday(dateStr: string) {
  return parseDateBR(dateStr).getDay()
}

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

function SkeletonCard() {
  return (
    <div className="rounded-3xl border border-border/60 bg-card px-4 py-4 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="h-6 w-48 rounded-md bg-muted-foreground/10" />
        <div className="h-5 w-14 rounded-full bg-muted-foreground/10" />
      </div>
      <div className="mt-3 h-4 w-36 rounded-md bg-muted-foreground/10" />
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex gap-1.5">
          <div className="h-5 w-20 rounded-full bg-muted-foreground/10" />
          <div className="h-5 w-24 rounded-full bg-muted-foreground/10" />
        </div>
        <div className="h-8 w-20 rounded-md bg-muted-foreground/10" />
      </div>
    </div>
  )
}

export function TripsHomePage() {
  const [period, setPeriod] = useState<Period>('week')
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [weekOffset, setWeekOffset] = useState(0)
  const [monthOffset, setMonthOffset] = useState(0)
  const [reservingId, setReservingId] = useState<string | null>(null)

  const { data: trips, isLoading, error } = useAvailableTrips()
  const reserveMutation = useReserveTrip()

  const availableWeekdays = useMemo(() => [1, 2, 3, 4, 5], [])

  const filteredTrips = useMemo(() => {
    if (!trips) return []

    let result = [...trips]

    if (period === 'week') {
      const { start, end } = getWeekRange(weekOffset)
      result = result.filter((t) => {
        const d = parseDateBR(t.trip_date)
        return d >= start && d <= end
      })
    }

    if (period === 'month') {
      const { start, end } = getMonthRange(monthOffset)
      result = result.filter((t) => {
        const d = parseDateBR(t.trip_date)
        return d >= start && d <= end
      })
    }

    if (selectedDays.length > 0) {
      result = result.filter((t) => selectedDays.includes(getWeekday(t.trip_date)))
    }

    return result
  }, [trips, period, selectedDays, weekOffset, monthOffset])

  const handleReserve = (tripId: string) => {
    setReservingId(tripId)
    reserveMutation.mutate(tripId, {
      onSettled: () => setReservingId(null),
    })
  }

  return (
    <AppLayout>
      <section className="mx-auto w-full max-w-5xl px-4 py-8 md:py-16">
        <header className="mb-8 md:mb-12 space-y-2">
          <p className="text-[10px] md:text-xs font-semibold tracking-[0.2em] text-primary uppercase">
            Viagens disponiveis
          </p>
          <h1 className="font-heading text-xl sm:text-2xl md:text-4xl font-semibold tracking-tight text-foreground">
            Selecione sua viagem
          </h1>
          <p className="max-w-prose text-xs md:text-sm text-muted-foreground">
            Reserve seu lugar nas viagens disponiveis para os proximos dias.
          </p>
        </header>

        {error && (
          <div className="mb-6 rounded-2xl bg-red-50 p-4 text-xs md:text-sm text-red-700">
            {typeof error === 'string'
              ? error
              : error instanceof Error
                ? error.message
                : 'Nao foi possivel carregar as viagens no momento.'}
          </div>
        )}

        <div className="mb-8 md:mb-10">
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
        </div>

        <div className="mb-4 text-sm font-semibold text-foreground/80">
          {filteredTrips.length}{' '}
          {filteredTrips.length === 1
            ? 'viagem encontrada'
            : 'viagens encontradas'}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : filteredTrips.length === 0 && trips && trips.length > 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhuma viagem encontrada para este periodo.
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Tente selecionar outro dia, semana ou mes.
            </p>
          </div>
        ) : !isLoading && trips && trips.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhuma viagem cadastrada para os proximos horarios.
            </p>
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
                <TripCard
                  trip={trip}
                  isReserving={reservingId === trip.id}
                  onReserve={handleReserve}
                />
              </motion.div>
            ))}
          </div>
        )}

        <p className="mt-12 text-center text-xs text-muted-foreground">
          As viagens exibidas respeitam o prazo de reserva e a disponibilidade de vagas no onibus.
        </p>
      </section>
    </AppLayout>
  )
}
