import { useState } from 'react'
import {
  useCreateTrip,
  useUpdateTrip,
  useRoutes,
  useBuses,
  useDrivers,
} from '@/features/trips/hooks/useTrips'
import type { Trip, TripStatus } from '@/features/trips/types'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/lib/ui/field'
import { Button } from '@ui/button'
import { Input } from '@ui/input'
import { STATUS_CONFIG } from './StatusBadge'

const TRIP_STATUSES: TripStatus[] = [
  'RISCO DE CANCELAMENTO',
  'CANCELADA',
  'CONFIRMADA',
  'EM ANDAMENTO',
  'CONCLUÍDA',
]

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

type Props = {
  onSuccess: () => void
  tripValues?: Trip
}

export function TripForm({ onSuccess, tripValues }: Props) {
  const isEdit = !!tripValues
  const createTrip = useCreateTrip()
  const updateTrip = useUpdateTrip(tripValues?.id ?? '')
  const { data: routes } = useRoutes()
  const { data: buses } = useBuses()
  const { data: drivers } = useDrivers()

  const isSaving = createTrip.isPending || updateTrip.isPending

  const [recurring, setRecurring] = useState(false)
  const [tripDate, setTripDate] = useState(tripValues?.trip_date ?? '')
  const [weekdays, setWeekdays] = useState<number[]>([])
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [route, setRoute] = useState(tripValues ? String(tripValues.route) : '')
  const [status, setStatus] = useState<TripStatus>(tripValues?.status ?? 'RISCO DE CANCELAMENTO')
  const [bus, setBus] = useState(tripValues?.bus ? String(tripValues.bus) : '')
  const [driver, setDriver] = useState('')
  const [error, setError] = useState<string | null>(null)

  function toggleWeekday(day: number) {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!recurring && !tripDate) {
      setError('Informe a data da viagem.')
      return
    }
    if (recurring && weekdays.length === 0) {
      setError('Selecione pelo menos um dia da semana.')
      return
    }
    if (recurring && (!dateStart || !dateEnd)) {
      setError('Informe a data de início e fim.')
      return
    }
    if (!route) {
      setError('Selecione uma rota.')
      return
    }

    const payload: Record<string, unknown> = {
      route,
      status,
    }

    if (recurring) {
      payload.recurring = true
      payload.weekdays = weekdays
      payload.date_start = dateStart
      payload.date_end = dateEnd
    } else {
      payload.trip_date = tripDate
    }

    if (!recurring) {
      if (bus) payload.bus = bus
      if (driver) payload.driver = driver
    }

    if (isEdit) {
      updateTrip.mutate(payload as Partial<Trip>, { onSuccess: () => onSuccess() })
    } else {
      createTrip.mutate(payload as Partial<Trip>, { onSuccess: () => onSuccess() })
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        {!isEdit && (
          <Field>
            <div className="flex items-center gap-2">
              <input
                id="recurring"
                type="checkbox"
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <FieldLabel htmlFor="recurring" className="mb-0 block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Viagem recorrente
              </FieldLabel>
            </div>
          </Field>
        )}

        {!recurring && (
          <Field>
            <FieldLabel htmlFor="tripDate" className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Data da viagem *</FieldLabel>
            <Input
              id="tripDate"
              type="date"
              lang="pt-BR"
              value={tripDate}
              onChange={(e) => setTripDate(e.target.value)}
              className="h-8 rounded-md border-border bg-card px-2.5 text-xs focus-visible:ring-2"
            />
          </Field>
        )}

        {recurring && (
          <>
            <Field>
              <FieldLabel className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Dias da semana *</FieldLabel>
              <div className="flex items-center gap-1">
                {WEEKDAYS.map((label, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleWeekday(idx)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md border transition-all cursor-pointer ${
                      weekdays.includes(idx)
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-card text-muted-foreground border-border hover:border-ring hover:text-foreground hover:shadow-sm'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="dateStart" className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Data início *</FieldLabel>
                <Input
                  id="dateStart"
                  type="date"
                  lang="pt-BR"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                  className="h-8 rounded-md border-border bg-card px-2.5 text-xs focus-visible:ring-2"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="dateEnd" className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Data fim *</FieldLabel>
                <Input
                  id="dateEnd"
                  type="date"
                  lang="pt-BR"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                  className="h-8 rounded-md border-border bg-card px-2.5 text-xs focus-visible:ring-2"
                />
              </Field>
            </div>
          </>
        )}

        <Field>
          <FieldLabel htmlFor="route" className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Rota *</FieldLabel>
          <select
            id="route"
            value={route}
            onChange={(e) => setRoute(e.target.value)}
            className="h-8 w-full rounded-md border border-border bg-card px-2.5 text-xs outline-none focus-visible:ring-2"
          >
            <option value="">Selecione uma rota</option>
            {routes?.map((r) => (
              <option key={r.id} value={r.id}>
                {r.origin} → {r.destiny} ({r.departure_time} - {r.arrival_time})
              </option>
            ))}
          </select>
        </Field>

        <Field>
          <FieldLabel htmlFor="status" className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Status *</FieldLabel>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TripStatus)}
            className="h-8 w-full rounded-md border border-border bg-card px-2.5 text-xs outline-none focus-visible:ring-2"
          >
            {TRIP_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
        </Field>

        {!recurring && (
          <>
            <Field>
              <FieldLabel htmlFor="driver" className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Motorista</FieldLabel>
              <select
                id="driver"
                value={driver}
                onChange={(e) => setDriver(e.target.value)}
                className="h-8 w-full rounded-md border border-border bg-card px-2.5 text-xs outline-none focus-visible:ring-2"
              >
                <option value="">Nenhum</option>
                {drivers?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name}
                  </option>
                ))}
              </select>
            </Field>

            <Field>
              <FieldLabel htmlFor="bus" className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Ônibus</FieldLabel>
              <select
                id="bus"
                value={bus}
                onChange={(e) => setBus(e.target.value)}
                className="h-8 w-full rounded-md border border-border bg-card px-2.5 text-xs outline-none focus-visible:ring-2"
              >
                <option value="">Nenhum</option>
                {buses?.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.number_plate} - {b.brand}
                  </option>
                ))}
              </select>
            </Field>
          </>
        )}

        {error && (
          <FieldDescription className="text-red-500">
            {error}
          </FieldDescription>
        )}

        <Field>
          <Button type="submit" className="cursor-pointer" disabled={isSaving}>
            {isSaving
              ? 'Salvando...'
              : isEdit
                ? 'Salvar alterações'
                : 'Criar viagem'}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
