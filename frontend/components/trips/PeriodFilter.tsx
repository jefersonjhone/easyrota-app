import { useMemo } from 'react'
import { ArrowLeft, ArrowRight, CalendarDots, CalendarCheck } from '@phosphor-icons/react'

const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export type Period = 'week' | 'month'

export type PeriodFilterProps = {
  period: Period
  onPeriodChange: (period: Period) => void
  selectedDays: number[]
  onDaysChange: (days: number[]) => void
  weekOffset: number
  onWeekOffsetChange: (offset: number) => void
  monthOffset: number
  onMonthOffsetChange: (offset: number) => void
  availableWeekdays: number[]
}

function getWeekRange(offset: number) {
  const now = new Date()
  const day = now.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMonday + offset * 7)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { start: monday, end: sunday }
}

function formatDateBR(date: Date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function PeriodFilter({
  period,
  onPeriodChange,
  selectedDays,
  onDaysChange,
  weekOffset,
  onWeekOffsetChange,
  monthOffset,
  onMonthOffsetChange,
  availableWeekdays,
}: PeriodFilterProps) {
  const toggleDay = (day: number) => {
    onDaysChange(
      selectedDays.includes(day) ? [] : [day],
    )
  }

  const weekLabel = useMemo(() => {
    const { start, end } = getWeekRange(weekOffset)
    return `${formatDateBR(start)} - ${formatDateBR(end)}`
  }, [weekOffset])

  const monthLabel = useMemo(() => {
    const now = new Date()
    const target = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
    return `${MONTHS[target.getMonth()]} ${target.getFullYear()}`
  }, [monthOffset])

  const isCurrentWeek = weekOffset === 0
  const isCurrentMonth = monthOffset === 0

  return (
    <div className="space-y-4">
      <div className="inline-flex items-center rounded-xl border border-border bg-card p-1 gap-0">
        <button
          type="button"
          onClick={() => onPeriodChange('week')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            period === 'week'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <CalendarDots size={14} weight={period === 'week' ? 'fill' : 'regular'} />
          Semana
        </button>
        <button
          type="button"
          onClick={() => onPeriodChange('month')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            period === 'month'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <CalendarCheck size={14} weight={period === 'month' ? 'fill' : 'regular'} />
          Mes
        </button>
      </div>

      {(period === 'week' || period === 'month') && (
        <>
          {period === 'week' && (
            <div className="inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-card px-3 py-2">
              <button
                type="button"
                onClick={() => onWeekOffsetChange(weekOffset - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                aria-label="Semana anterior"
              >
                <ArrowLeft size={14} />
              </button>
              <span className="min-w-[160px] text-center text-xs font-semibold text-foreground">
                {isCurrentWeek && (
                  <span className="mr-1.5 inline-block rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary uppercase">
                    Atual
                  </span>
                )}
                {weekLabel}
              </span>
              <button
                type="button"
                onClick={() => onWeekOffsetChange(weekOffset + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                aria-label="Proxima semana"
              >
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {period === 'month' && (
            <div className="inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-card px-3 py-2">
              <button
                type="button"
                onClick={() => onMonthOffsetChange(monthOffset - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                aria-label="Mes anterior"
              >
                <ArrowLeft size={14} />
              </button>
              <span className="min-w-[160px] text-center text-xs font-semibold text-foreground">
                {isCurrentMonth && (
                  <span className="mr-1.5 inline-block rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary uppercase">
                    Atual
                  </span>
                )}
                {monthLabel}
              </span>
              <button
                type="button"
                onClick={() => onMonthOffsetChange(monthOffset + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                aria-label="Proximo mes"
              >
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          <div className="rounded-2xl border border-border/70 bg-muted/20 p-2.5 flex flex-wrap gap-1.5">
            {availableWeekdays.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-wide transition-colors cursor-pointer ${
                  selectedDays.includes(day)
                    ? 'bg-primary text-primary-foreground'
                    : selectedDays.length === 0
                      ? 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                      : 'bg-muted/50 text-muted-foreground/60'
                }`}
              >
                {WEEKDAY_SHORT[day]}
              </button>
            ))}
            {selectedDays.length > 0 && (
              <button
                type="button"
                onClick={() => onDaysChange([])}
                className="rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
