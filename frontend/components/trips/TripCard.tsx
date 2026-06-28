import { Link } from '@tanstack/react-router'
import { Button } from '@ui/button'
import { CheckCircle } from '@phosphor-icons/react'
import type { AvailableTrip } from '@/features/user-home/types'

export type TripCardProps = {
  trip: AvailableTrip
  isReserving: boolean
  onReserve: (id: string) => void
}

export function TripCard({ trip, isReserving, onReserve }: TripCardProps) {
  const isAlreadyReserved = trip.user_is_reserved

  return (
    <Link
      to="/app/viagens/$id"
      params={{ id: trip.id }}
      className="block rounded-3xl border border-border/60 bg-card px-4 py-4 shadow-sm transition-all duration-300 ease-out hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-heading text-lg md:text-xl font-semibold tracking-tight text-foreground">
              {trip.origin}
              <span className="mx-1.5 text-muted-foreground/40">&rarr;</span>
              {trip.destiny}
            </h2>
          </div>
          <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-primary">
            {trip.available_seats} {trip.available_seats === 1 ? 'vaga' : 'vagas'}
          </span>
        </div>

        {trip.trip_date && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-lg border border-border/60 bg-muted/40 px-2.5 py-1">
              <p className="text-[9px] font-semibold tracking-[0.2em] text-muted-foreground uppercase leading-relaxed">
                Data
              </p>
              <p className="text-[11px] font-semibold text-foreground">
                {trip.trip_date}
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/40 px-2.5 py-1">
              <p className="text-[9px] font-semibold tracking-[0.2em] text-muted-foreground uppercase leading-relaxed">
                Hora
              </p>
              <p className="text-[11px] font-semibold text-foreground">
                {trip.departure_time}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {trip.status_trip}
            </span>
            {trip.quorum_met !== undefined && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  trip.quorum_met
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                Quorum: {trip.quorum_met ? 'atingido' : 'pendente'}
              </span>
            )}
          </div>

          {isAlreadyReserved ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-600/20 shrink-0">
              <CheckCircle size={12} weight="fill" />
              Reservado
            </span>
          ) : (
            <Button
              variant="default"
              size="sm"
              disabled={!trip.is_reservable || isReserving}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault()
                e.stopPropagation()
                onReserve(trip.id)
              }}
              className="shrink-0 cursor-pointer"
            >
              {!trip.is_reservable
                ? 'Indisponível'
                : isReserving
                  ? 'Reservando...'
                  : 'Reservar'}
            </Button>
          )}
        </div>
      </div>
    </Link>
  )
}
