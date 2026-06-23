import { useState } from "react";
import type { RouteValues } from "@/features/admin/hooks/useRoutes";
import {
  DeleteRoute,
  UpdateRoute,
  type CreateRouteValues,
} from "../../services/RoutesRequests";
import { RouteForm } from "./RoutesForm";
import { ConfirmDeleteDialog } from "@/lib/ui/delete-alert";
import { PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { Button } from "@ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@ui/dialog'

function formatTime(t: string) {
  return t.length > 5 ? t.slice(0, 5) : t
}

type Props = {
  routes: RouteValues[];
  onRefresh?: () => void;
};

export function RoutesView({ routes, onRefresh }: Props) {
  const [editingRoute, setEditingRoute] = useState<RouteValues | null>(null);

  if (routes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground text-center">
        Nenhuma rota cadastrada ainda.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border/70 bg-card/90 overflow-hidden">
        <div className="hidden md:grid md:grid-cols-[1fr_1fr_80px_80px_100px] md:px-5 md:py-2 md:bg-muted/40 md:text-[11px] md:font-semibold md:tracking-wider md:text-muted-foreground md:uppercase md:border-b md:border-border/50">
          <span>Origem</span>
          <span>Destino</span>
          <span>Saída</span>
          <span>Chegada</span>
          <span className="text-right">Ações</span>
        </div>
        <div className="divide-y divide-border/50">
          {routes.map((route) => (
            <div
              key={route.id}
              className="flex flex-col gap-1 px-5 py-3 text-sm transition-colors hover:bg-muted/30 md:grid md:grid-cols-[1fr_1fr_80px_80px_100px] md:items-center"
            >
              <span className="font-medium">{route.origin}</span>
              <span className="text-muted-foreground text-xs md:text-sm md:text-foreground">{route.destiny}</span>
              <span className="font-mono text-xs md:text-sm font-semibold">{formatTime(route.departure_time)}</span>
              <span className="font-mono text-xs md:text-sm font-semibold">{formatTime(route.arrival_time)}</span>
              <div className="flex items-center gap-1 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingRoute(route)}
                  className="inline-flex items-center justify-center p-1.5 rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  title="Editar rota"
                >
                  <PencilSimpleIcon size={14} />
                </button>
                <ConfirmDeleteDialog
                  onConfirm={async () => {
                    await DeleteRoute(route.id);
                    if (onRefresh) onRefresh();
                  }}
                  trigger={
                    <Button variant="ghost" size="sm" className="p-1.5 h-auto text-muted-foreground hover:text-destructive">
                      <TrashIcon size={14} />
                    </Button>
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={editingRoute !== null} onOpenChange={(open) => { if (!open) setEditingRoute(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar rota</DialogTitle>
          </DialogHeader>
          {editingRoute && (
            <RouteForm
              onSend={async (values: CreateRouteValues) => {
                await UpdateRoute(editingRoute.id, values);
                setEditingRoute(null);
                if (onRefresh) onRefresh();
              }}
              routeValues={editingRoute}
              buttonCaption="Salvar alterações"
              buttonCaptionLoad="Enviando"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
