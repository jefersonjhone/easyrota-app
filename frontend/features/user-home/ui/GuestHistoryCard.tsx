import { Card, CardContent, CardHeader, CardTitle } from "@/lib/ui/card"
import { Link } from '@tanstack/react-router'
import { Users, ArrowRight } from "@phosphor-icons/react"
import { useGuestHistory } from "@features/user-home/hooks/useGuestHistory"


export function GuestHistoryCard() {
  const { data: guests, isPending, isError } = useGuestHistory()

  if (isPending) {
    return (
      <Card className="border-border/70 bg-card/95">
        <CardHeader className="border-b border-border/70 pb-3 md:pb-5">
          <CardTitle className="font-heading text-sm md:text-xl font-semibold tracking-tight">Histórico de Convidados</CardTitle>
        </CardHeader>
        <CardContent className="pt-3 md:pt-6">
          <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-4 md:p-6 text-xs md:text-sm text-muted-foreground">
            Carregando...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isError || !guests || guests.length === 0) {
    return (
      <Card className="border-border/70 bg-card/95">
        <CardHeader className="border-b border-border/70 pb-3 md:pb-5">
          <CardTitle className="font-heading text-sm md:text-xl font-semibold tracking-tight">Histórico de Convidados</CardTitle>
        </CardHeader>
        <CardContent className="pt-3 md:pt-6">
          <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-4 md:p-6 text-xs md:text-sm text-muted-foreground">
            Nenhum convidado registrado.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/70 bg-card/95">
      <CardHeader className="border-b border-border/70 pb-3 md:pb-5">
        <CardTitle className="font-heading text-sm md:text-xl font-semibold tracking-tight">Histórico de Convidados</CardTitle>
      </CardHeader>
      <CardContent className="pt-3 md:pt-6">
        <div className="space-y-2 md:space-y-3">
          {guests.slice(0, 4).map((guest) => (
            <Link
              key={guest.id}
              to="/app/viagens/$id"
              params={{ id: guest.trip_id }}
              className="block rounded-3xl border border-border/70 bg-muted/20 p-3 md:p-4 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-2 md:gap-3">
                <div className="flex items-start gap-2 md:gap-3 min-w-0">
                  <Users size={16} className="mt-0.5 shrink-0 text-muted-foreground md:size-[20px]" />
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm font-medium">
                      {guest.full_name}
                    </p>
                    <p className="mt-0.5 text-[10px] md:text-xs text-muted-foreground">
                      {guest.trip_origin} → {guest.trip_destiny}
                    </p>
                    <p className="text-[10px] md:text-xs text-muted-foreground">
                      {guest.trip_date}
                    </p>
                  </div>
                </div>
                <ArrowRight size={14} className="shrink-0 text-muted-foreground md:size-[16px]" />
              </div>
            </Link>
          ))}

          <div className="pt-2 text-center">
            <Link
              to="/app/historico"
              className="text-xs md:text-sm font-medium text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
            >
              Ver histórico completo
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
