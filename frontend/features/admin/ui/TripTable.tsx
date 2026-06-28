import { Link } from '@tanstack/react-router'
import { PencilSimpleIcon, TrashIcon, MapPin } from '@phosphor-icons/react'
import { Button } from '@ui/button'
import { ConfirmDeleteDialog } from '@ui/delete-alert'
import { STATUS_CONFIG } from '@/features/admin/ui/routes/StatusBadge'
import type { Trip } from '@/features/trips/types'

function OccupancyBar({ active, capacity }: { active: number; capacity: number }) {
  const pct = capacity > 0 ? Math.min((active / capacity) * 100, 100) : 0
  const color = pct >= 90 ? 'bg-red-400' : pct >= 60 ? 'bg-orange-400' : 'bg-primary'
  return (
    <div className="flex flex-col gap-1">
      <div className="h-1.5 w-full max-w-20 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-muted-foreground leading-tight">{active}/{capacity} vagas</span>
    </div>
  )
}

export function TripTable({
  trips,
  selectedIds,
  onToggleSelect,
  onToggleAll,
  onEdit,
  onDelete,
  showCheckboxes = true,
  showDateColumn = false,
}: {
  trips: Trip[]
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onToggleAll: (ids: string[], select: boolean) => void
  onEdit: (trip: Trip) => void
  onDelete: (id: string) => void
  showCheckboxes?: boolean
  showDateColumn?: boolean
}) {
  const tripIds = trips.map(t => t.id)
  const allSelected = trips.length > 0 && trips.every(t => selectedIds.has(t.id))

  const gridCols = [
    showCheckboxes && '30px',
    '70px',
    '1fr',
    showDateColumn && '120px',
    '120px',
    '140px',
    '60px',
  ].filter(Boolean).join(' ')

  return (
    <div className="rounded-lg border border-border/70 bg-card/90 overflow-hidden">
      <div
        className="hidden md:grid md:px-5 md:py-2 md:bg-muted/40 md:text-[11px] md:font-semibold md:tracking-wider md:text-muted-foreground md:uppercase md:border-b md:border-border/50"
        style={{ gridTemplateColumns: gridCols }}
      >
        {showCheckboxes && (
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => onToggleAll(tripIds, !allSelected)}
            className="h-4 w-4 cursor-pointer accent-primary"
          />
        )}
        <span>Horário</span>
        <span>Rota</span>
        {showDateColumn && <span>Data</span>}
        <span className="text-center">Status</span>
        <span>Ocupação</span>
        <span className="text-right">Ações</span>
      </div>
      <div className="divide-y divide-border/50">
        {trips.map((trip) => (
          <div
            key={trip.id}
            className="flex flex-row flex-wrap items-center gap-x-3 gap-y-1.5 px-5 py-3 text-sm transition-colors hover:bg-muted/30 md:grid md:items-center"
            style={{ gridTemplateColumns: gridCols }}
          >
            {showCheckboxes && (
              <input
                type="checkbox"
                checked={selectedIds.has(trip.id)}
                onChange={() => onToggleSelect(trip.id)}
                className="h-4 w-4 cursor-pointer accent-primary"
              />
            )}
            <Link
              to="/admin/viagens/$id"
              params={{ id: String(trip.id) }}
              className="contents"
            >
              <span className="text-muted-foreground text-xs md:text-sm md:text-foreground font-mono font-semibold">
                {trip.departure_time}
              </span>
              <span className="font-medium truncate leading-tight hover:underline underline-offset-1 flex items-center gap-1.5">
                <MapPin size={14} className="text-primary/60 shrink-0" />
                {trip.origin} → {trip.destiny}
              </span>
              {showDateColumn && (
                <span className="text-muted-foreground text-xs md:text-sm md:text-foreground">
                  {formatDate(trip.trip_date)}
                </span>
              )}
              <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-tight ${STATUS_CONFIG[trip.status].className} truncate`}>
                {STATUS_CONFIG[trip.status].label}
              </span>
              <OccupancyBar active={trip.active_reservations} capacity={trip.seating_capacity} />
            </Link>
            <div className="flex items-center gap-1 w-full md:w-auto justify-end -mr-1 mt-1 md:mt-0">
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[44px] min-w-[44px] p-2 text-muted-foreground hover:text-foreground"
                onClick={() => onEdit(trip)}
              >
                <PencilSimpleIcon size={15} />
              </Button>
              <ConfirmDeleteDialog
                onConfirm={() => onDelete(trip.id)}
                trigger={
                  <Button variant="ghost" size="sm" className="min-h-[44px] min-w-[44px] p-2 text-muted-foreground hover:text-destructive">
                    <TrashIcon size={15} />
                  </Button>
                }
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const DAY_NAMES_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  const [year, month, day] = dateStr.split('-')
  return `${DAY_NAMES_SHORT[d.getDay()]}, ${day}/${month}/${year}`
}
