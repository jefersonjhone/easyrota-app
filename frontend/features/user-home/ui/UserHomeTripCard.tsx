import { Link } from '@tanstack/react-router'
import { Button } from '@ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@ui/card'

import { formatTripDate, getStatusTone } from '../config'
import type { CurrentTripData } from '../types'

type UserHomeTripCardProps = {
  currentTrip: CurrentTripData | null
  isLoading: boolean
  error: string | null
}

function UserHomeTripInfo({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-3xl bg-muted/30 p-2 md:p-4">
      <p className="text-[9px] md:text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-0.5 md:mt-2 text-[11px] md:text-base font-semibold">{value}</p>
    </div>
  )
}

export function UserHomeTripCard({
  currentTrip,
  isLoading,
  error,
}: UserHomeTripCardProps) {
  return (
    <Card className="border-border/70 bg-card/95">
        <CardHeader className="border-b border-border/70 pb-4 md:pb-5">
        <CardTitle className="text-base md:text-lg">Próxima viagem</CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Informações operacionais do sistema.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 md:space-y-4 pt-4 md:pt-6">
        {isLoading ? (
          <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
            Carregando sua próxima viagem e o histórico recente...
          </div>
        ) : currentTrip ? (
          <>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] md:text-sm text-muted-foreground">Rota</p>
                  <h2 className="mt-0.5 font-heading text-sm md:text-2xl font-semibold tracking-tight">
                    {currentTrip.origin} → {currentTrip.destiny}
                  </h2>
                </div>

                <span
                  className={`shrink-0 inline-flex rounded-full px-2 md:px-3 py-0.5 md:py-1 text-[9px] md:text-xs font-semibold tracking-wide uppercase ring-1 ${getStatusTone(currentTrip.status_route)}`}
                >
                  {currentTrip.status_route}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 md:gap-3 xl:grid-cols-4">
              <UserHomeTripInfo label="Data" value={formatTripDate(currentTrip.trip_date)} />
              <UserHomeTripInfo label="Partida" value={currentTrip.departure_time} />
              <UserHomeTripInfo label="Ônibus" value={currentTrip.bus_number_plate} />
              <UserHomeTripInfo label="Motorista" value={currentTrip.driver} />
            </div>

            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <div className="rounded-3xl border border-border/70 p-2 md:p-4">
                <p className="text-[9px] md:text-sm text-muted-foreground">Status</p>
                <p className="mt-0.5 md:mt-2 text-[11px] md:text-lg font-semibold">{currentTrip.status_trip}</p>
              </div>

              <div className="rounded-3xl border border-border/70 p-2 md:p-4">
                <p className="text-[9px] md:text-sm text-muted-foreground">Progresso</p>
                <p className="mt-0.5 md:mt-2 text-[11px] md:text-lg font-semibold">
                  {currentTrip.percentage_complete}%
                </p>
                <p className="text-[9px] md:text-sm text-muted-foreground">
                  {currentTrip.minutes_remaining !== null
                    ? `${currentTrip.minutes_remaining} min restantes`
                    : 'Tempo indisponível'}
                </p>
              </div>
            </div>

            <Link to={`/app/viagens/$id`} params={{ id: currentTrip.id }}>
              <Button size="sm">Ver detalhes da viagem</Button>
            </Link>
          </>
        ) : (
          <div className="space-y-3 md:space-y-4 rounded-3xl border border-dashed border-border bg-muted/30 p-4 md:p-6">
            <div>
              <h3 className="text-sm md:text-lg font-semibold">Nenhuma viagem próxima</h3>
              <p className="mt-1.5 md:mt-2 text-xs md:text-sm leading-relaxed text-muted-foreground">
                Quando houver uma reserva ou uma viagem vinculada ao seu perfil, ela
                aparecerá aqui com status, horário e motorista.
              </p>
            </div>
            <Link to="/app/viagens">
              <Button size="sm">
                Explorar viagens futuras
              </Button>
            </Link>
          </div>
        )}

        {error ? (
          <p className="rounded-3xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
