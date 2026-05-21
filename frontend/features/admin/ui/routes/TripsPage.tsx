import { useState } from 'react'
import {
  useBuses,
  useCreateTrip,
  useDeleteTrip,
  useRoutes,
  useTrips,
  useUpdateTrip,
} from '@/features/trips/hooks/useTrips'
import type { Trip, TripStatus } from '@/features/trips/types'
import { Button } from '@ui/button'
import { Input } from '@ui/input'
import { ConfirmDeleteDialog } from '@ui/delete-alert'

const TRIP_STATUSES: TripStatus[] = [
  'CONFIRMADA',
  'EM ANDAMENTO',
  'CONCLUÍDA',
  'CANCELADA',
  'RISCO DE CANCELAMENTO',
]

const STATUS_CONFIG: Record<TripStatus, { label: string; className: string }> = {
  'CONFIRMADA': { label: 'Confirmada', className: 'bg-green-100 text-green-700' },
  'EM ANDAMENTO': { label: 'Em Andamento', className: 'bg-blue-100 text-blue-700' },
  'CONCLUÍDA': { label: 'Concluída', className: 'bg-gray-100 text-gray-500' },
  'CANCELADA': { label: 'Cancelada', className: 'bg-red-100 text-red-700' },
  'RISCO DE CANCELAMENTO': { label: 'Risco de Cancelamento', className: 'bg-orange-100 text-orange-700' },
}

type FormData = {
  trip_date: string
  status: TripStatus
  bus: string
  route: string
}

const EMPTY_FORM: FormData = {
  trip_date: '',
  status: 'CONFIRMADA',
  bus: '',
  route: '',
}

function StatusBadge({ status }: { status: TripStatus }) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: 'bg-muted text-muted-foreground' }
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${config.className}`}>
      {config.label}
    </span>
  )
}

function OccupancyBar({ active, capacity }: { active: number; capacity: number }) {
  const pct = capacity > 0 ? Math.min((active / capacity) * 100, 100) : 0
  const color = pct >= 90 ? 'bg-red-400' : pct >= 60 ? 'bg-orange-400' : 'bg-primary'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground">{active}/{capacity} vagas</span>
    </div>
  )
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

function selectClass() {
  return 'h-9 w-full rounded-3xl border border-transparent bg-input/50 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30'
}

type Mode = 'list' | 'create' | 'edit'

export function TripsPage() {
  const [mode, setMode] = useState<Mode>('list')
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)

  const { data: trips, isLoading, error } = useTrips()
  const { data: buses } = useBuses()
  const { data: routes } = useRoutes()

  const createMutation = useCreateTrip()
  const updateMutation = useUpdateTrip(editingTrip?.id ?? 0)
  const deleteMutation = useDeleteTrip()

  const isSaving = createMutation.isPending || updateMutation.isPending

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditingTrip(null)
    setFormError(null)
    setMode('create')
  }

  function openEdit(trip: Trip) {
    setForm({
      trip_date: trip.trip_date,
      status: trip.status,
      bus: String(trip.bus),
      route: String(trip.route),
    })
    setEditingTrip(trip)
    setFormError(null)
    setMode('edit')
  }

  function handleCancel() {
    setMode('list')
    setEditingTrip(null)
    setFormError(null)
  }

  function handleChange(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setFormError(null)

    if (!form.trip_date || !form.bus || !form.route) {
      setFormError('Preencha todos os campos obrigatórios.')
      return
    }

    const data = {
      trip_date: form.trip_date,
      status: form.status,
      bus: Number(form.bus),
      route: Number(form.route),
    }

    if (mode === 'create') {
      createMutation.mutate(data, {
        onSuccess: () => { setMode('list') },
        onError: () => setFormError('Erro ao criar viagem. Verifique os dados e tente novamente.'),
      })
    } else if (editingTrip) {
      updateMutation.mutate(data, {
        onSuccess: () => { setMode('list') },
        onError: () => setFormError('Erro ao atualizar viagem. Verifique os dados e tente novamente.'),
      })
    }
  }

  function handleDelete(id: number) {
    deleteMutation.mutate(id)
  }

  const isFormMode = mode === 'create' || mode === 'edit'

  return (
    <section className="mx-auto w-full max-w-5xl px-4">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
            Viagens
          </p>
          <h1 className="font-heading text-4xl font-semibold tracking-tight">
            {mode === 'create' ? 'Nova viagem' : mode === 'edit' ? 'Editar viagem' : 'Minhas viagens'}
          </h1>
          <p className="text-muted-foreground">
            {isFormMode ? 'Preencha os dados da viagem abaixo.' : 'Acompanhe e gerencie todas as viagens.'}
          </p>
        </div>

        {!isFormMode && (
          <Button onClick={openCreate} className="shrink-0 mt-2">
            + Nova viagem
          </Button>
        )}
      </header>

      {isFormMode && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-4xl border border-border/70 bg-card/90 px-6 py-6 shadow-sm space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Data da viagem *</label>
              <Input
                type="date"
                lang="pt-BR"
                value={form.trip_date}
                onChange={(e) => handleChange('trip_date', e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Status *</label>
              <select
                className={selectClass()}
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value as TripStatus)}
              >
                {TRIP_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Rota *</label>
              <select
                className={selectClass()}
                value={form.route}
                onChange={(e) => handleChange('route', e.target.value)}
                required
              >
                <option value="">Selecione uma rota</option>
                {routes?.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.origin} → {r.destiny} ({r.departure_time} - {r.arrival_time})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Ônibus *</label>
              <select
                className={selectClass()}
                value={form.bus}
                onChange={(e) => handleChange('bus', e.target.value)}
                required
              >
                <option value="">Selecione um ônibus</option>
                {buses?.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.number_plate} — {b.brand} ({b.seating_capacity} lugares)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formError && (
            <p className="text-sm text-red-600">{formError}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando...' : mode === 'create' ? 'Criar viagem' : 'Salvar alterações'}
            </Button>
          </div>
        </form>
      )}

      {error ? (
        <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700">
          Não foi possível carregar as viagens. Verifique se você tem permissão para acessar este recurso.
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-4xl border border-dashed border-border bg-muted/30 p-8 text-center text-muted-foreground">
          Carregando viagens...
        </div>
      ) : !error && trips && trips.length === 0 ? (
        <div className="rounded-4xl border border-dashed border-border bg-muted/30 p-8 text-center text-muted-foreground">
          Nenhuma viagem cadastrada ainda.
        </div>
      ) : !error && trips ? (
        <div className="space-y-4">
          {trips.map((trip) => (
            <article
              key={trip.id}
              className="rounded-4xl border border-border/70 bg-card/90 px-5 py-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1.5">
                  <h2 className="font-heading text-2xl font-medium tracking-tight">
                    {trip.origin} &#8594; {trip.destiny}
                  </h2>
                  <p className="text-sm text-muted-foreground">{formatDate(trip.trip_date)}</p>
                  <OccupancyBar active={trip.active_reservations} capacity={trip.seating_capacity} />
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <StatusBadge status={trip.status} />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(trip)}
                  >
                    Editar
                  </Button>
                  <ConfirmDeleteDialog onConfirm={() => handleDelete(trip.id)} />
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {!error && trips && trips.length > 0 && (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          {trips.length} {trips.length === 1 ? 'viagem encontrada' : 'viagens encontradas'}
        </p>
      )}
    </section>
  )
}