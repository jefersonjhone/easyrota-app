import { Card, CardContent, CardHeader, CardTitle } from "@/lib/ui/card";
import { Warning } from "@phosphor-icons/react";
import { usePunishmentsHistory } from "@/features/user-home/hooks/usePunishmentHistory";
import { formatReservationCreatedAt } from '../config'

interface Punishment {
  id: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export function PunishmentsHistoryCard() {
  const { data: punishments, isPending, isError } = usePunishmentsHistory();

  if (isPending) {
    return (
      <Card className="border-border/70 bg-card/95">
        <CardHeader className="border-b border-border/70 pb-3 md:pb-5">
          <CardTitle className="font-heading text-sm md:text-xl font-semibold tracking-tight">Penalidades</CardTitle>
        </CardHeader>
        <CardContent className="pt-3 md:pt-6">
          <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-4 md:p-6 text-xs md:text-sm text-muted-foreground">
            Carregando...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !punishments || punishments.length === 0) {
    return (
      <Card className="border-border/70 bg-card/95">
        <CardHeader className="border-b border-border/70 pb-3 md:pb-5">
          <CardTitle className="font-heading text-sm md:text-xl font-semibold tracking-tight">Penalidades</CardTitle>
        </CardHeader>
        <CardContent className="pt-3 md:pt-6">
          <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-4 md:p-6 text-xs md:text-sm text-muted-foreground">
            Nenhuma penalidade registrada no seu perfil.
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  return (
    <Card className="border-border/70 bg-card/95">
      <CardHeader className="border-b border-border/70 pb-3 md:pb-5">
        <CardTitle className="font-heading text-sm md:text-xl font-semibold tracking-tight">Penalidades</CardTitle>
      </CardHeader>
      <CardContent className="pt-3 md:pt-6">
        <div className="space-y-2 md:space-y-3">
          {punishments.slice(0, 3).map((punishment: Punishment) => (
            <div
              key={punishment.id}
              className="rounded-3xl border border-border/70 bg-muted/20 p-3 md:p-4"
            >
              <div className="flex items-start justify-between gap-2 md:gap-3">
                <div className="flex items-start gap-2 md:gap-3 min-w-0">
                  <Warning
                    size={16}
                    className={`mt-0.5 shrink-0 md:size-[20px] ${
                      punishment.is_active
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm font-medium">
                      {punishment.description}
                    </p>
                    <p className="mt-0.5 md:mt-1 text-[10px] md:text-xs text-muted-foreground">
                      Registrado em: {formatDate(punishment.created_at)}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex shrink-0 rounded-full px-2 md:px-3 py-0.5 md:py-1 text-[9px] md:text-xs font-semibold tracking-wide uppercase ring-1 ${
                    punishment.is_active
                      ? "bg-destructive/10 text-destructive ring-destructive/20"
                      : "bg-muted text-muted-foreground ring-border"
                  }`}
                >
                  {punishment.is_active ? "Ativa" : "Cumprida"}
                </span>
              </div>
            </div>
          ))}

          <div className="w-full flex items-center mt-4">
            <a 
              href="/app/penalidades/historico" 
              className="mx-auto py-2 text-center text-chart-3 hover:text-chart-4 font-medium md:font-semibold underline"
            >
              Ver histórico completo
            </a>
          </div>
          
        </div>
      </CardContent>
    </Card>
  );
}
