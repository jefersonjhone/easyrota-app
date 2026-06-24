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
      <Card className="w-full rounded-sm border-0 shadow-md">
        <CardHeader><CardTitle className="text-xl">Histórico de Penalidades</CardTitle></CardHeader>
        <CardContent><p className="text-gray-500 text-sm">Carregando...</p></CardContent>
      </Card>
    );
  }

  if (isError || !punishments || punishments.length === 0) {
    return (
      <Card className="w-full rounded-sm border-0 shadow-md">
        <CardHeader>
          <CardTitle className="font-medium font-heading text-xl">Histórico de Penalidades</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">Nenhuma penalidade registrada no seu perfil.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full rounded-sm border-0 shadow-md px-0 mx-0">
      <CardHeader>
        <CardTitle className="font-medium font-heading text-xl">Histórico de Penalidades</CardTitle>
      </CardHeader>
      <CardContent className="px-2">
        <div className="space-y-2 md:space-y-4">
          {punishments.slice(0, 3).map((punishment: Punishment) => (
            <div
              key={punishment.id}
              className="flex justify-between items-center p-3 border rounded-sm transition-colors bg-white"
            >
              <div className="flex items-center gap-3 flex-1">
                <Warning 
                  className={`w-10 h-10 p-2 rounded-md ${
                    punishment.is_active 
                      ? "text-red-600 bg-red-100" 
                      : "text-gray-500 bg-gray-100"
                  }`} 
                />
                <div className="flex-1">
                  <p className="font-medium text-sm md:text-base text-gray-900">
                    {punishment.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    Registrado em: {formatReservationCreatedAt(punishment.created_at)}
                  </p>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 h-fit rounded-sm text-xs font-medium text-white ${
                  punishment.is_active ? "bg-red-600" : "bg-gray-400"
                }`}
              >
                {punishment.is_active ? "Ativa" : "Cumprida"}
              </span>
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