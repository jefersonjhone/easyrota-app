import { Link } from '@tanstack/react-router'
import { useTripsHistory } from "@features/user-home/hooks/useTripsHistory"
import { Card, CardContent, CardHeader, CardTitle } from "@/lib/ui/card"
import { getStatusTone } from "@features/user-home/config"
import type { Trip } from "@features/user-home/types"

export function TripsHistoryCard() {
  const { data: trips } = useTripsHistory(3)

  const loading = false
  const error = false

  if (loading) {
    return (
      <Card className="border-border/70 bg-card/95">
        <CardHeader className="border-b border-border/70 pb-3 md:pb-5">
          <CardTitle className="font-heading text-sm md:text-xl font-semibold tracking-tight">Histórico de Viagens</CardTitle>
        </CardHeader>
        <CardContent className="pt-3 md:pt-6">
          <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-4 md:p-6 text-xs md:text-sm text-muted-foreground">
            Carregando...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-border/70 bg-card/95">
        <CardHeader className="border-b border-border/70 pb-3 md:pb-5">
          <CardTitle className="font-heading text-sm md:text-xl font-semibold tracking-tight">Histórico de Viagens</CardTitle>
        </CardHeader>
        <CardContent className="pt-3 md:pt-6">
          <div className="rounded-3xl bg-destructive/10 p-3 md:p-4 text-xs md:text-sm text-destructive">
            Erro ao carregar histórico
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!trips || trips.length === 0) {
    return (
      <Card className="border-border/70 bg-card/95">
        <CardHeader className="border-b border-border/70 pb-3 md:pb-5">
          <CardTitle className="font-heading text-sm md:text-xl font-semibold tracking-tight">Histórico de Viagens</CardTitle>
        </CardHeader>
        <CardContent className="pt-3 md:pt-6">
          <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-4 md:p-6 text-xs md:text-sm text-muted-foreground">
            Nenhuma viagem encontrada.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/70 bg-card/95">
      <CardHeader className="border-b border-border/70 pb-3 md:pb-5">
        <CardTitle className="font-heading text-sm md:text-xl font-semibold tracking-tight">Últimas Reservas</CardTitle>
      </CardHeader>
      <CardContent className="pt-3 md:pt-6">
        <div className="space-y-2 md:space-y-3">
          {trips.map((trip: Trip) => (
            <Link
              key={trip.id}
              to="/app/viagens/$id"
              params={{ id: trip.id }}
              className="block rounded-3xl border border-border/70 bg-muted/20 p-3 md:p-4 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-2 md:gap-3">
                <div className="min-w-0">
                  <p className="font-heading text-sm md:text-base font-semibold tracking-tight">
                    {trip.origin} → {trip.destiny}
                  </p>
                  <p className="mt-0.5 md:mt-1 text-[11px] md:text-sm text-muted-foreground">
                    {trip.trip_date} às {trip.trip_departure}
                  </p>
                </div>
                <span
                  className={`inline-flex shrink-0 rounded-full px-2 md:px-3 py-0.5 md:py-1 text-[9px] md:text-xs font-semibold tracking-wide uppercase ring-1 ${getStatusTone(trip.trip_history_status)}`}
                >
                  {trip.trip_history_status}
                </span>
              </div>
            </Link>
          ))}

          <div className="pt-2 text-center">
            <Link
              to="/app/historico"
              className="text-sm font-medium text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
            >
              Ver histórico completo
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
