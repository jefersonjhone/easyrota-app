import { Link } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@ui/card'
import { Button } from '@ui/button'

import {
  formatReservationCreatedAt,
  formatTripDate,
  getStatusTone,
} from '../config'
import type { ReservationHistoryItem } from '../types'

type UserHomeHistoryCardProps = {
  reservations: ReservationHistoryItem[]
  error: string | null
}

export function UserHomeHistoryCard({
  reservations,
  error,
}: UserHomeHistoryCardProps) {
  return (
    <Card id="historico" className="border-border/70 bg-card/95">
      <CardHeader className="border-b border-border/70 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle>Histórico recente</CardTitle>
            <CardDescription>
              Últimas reservas recuperadas do sistema de reservas.
            </CardDescription>
          </div>
          <Link to="/app/viagens/historico">
            <Button variant="outline" size="sm">
              Ver tudo
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {error ? (
          <div className="rounded-3xl bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : reservations.length > 0 ? (
          reservations.map((reservation) => (
            <article
              key={reservation.id}
              className="rounded-3xl border border-border/70 bg-muted/20 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">
                    {reservation.origin} → {reservation.destiny}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatTripDate(reservation.trip_date)} · criada em{' '}
                    {formatReservationCreatedAt(reservation.created_at)}
                  </p>
                </div>

                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase ring-1 ${getStatusTone(reservation.trip_history_status)}`}
                >
                  {reservation.trip_history_status}
                </span>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
            Ainda não existem reservas registradas para esta conta.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
