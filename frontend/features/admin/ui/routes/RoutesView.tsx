import type { RouteValues } from "@/features/admin/hooks/useRoutes";
import { Button } from "@/lib/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/lib/ui/card";
import { useState } from "react";
import {
  DeleteRoute,
  UpdateRoute,
  type CreateRouteValues,
} from "../../services/RoutesRequests";
import { RouteForm } from "./RoutesForm";
import { ConfirmDeleteDialog } from "@/lib/ui/delete-alert";

type Props = {
  routes: RouteValues[];
  onRefresh?: () => void;
};

export function RoutesView({ routes, onRefresh }: Props) {
  const [clicked, setClicked] = useState(false);
  const [cardId, setCardId] = useState(-1);
  const [editing, setEditing] = useState(false);
  if (routes.length > 0) {
    return (
      <>
        {routes.map((route: RouteValues) => (
          <>
            <>
              {(!editing || cardId != route.id) && (
                <div className="grid gap-2">
                  <Card
                    key={route.origin + "->" + route.destiny}
                    className="flex flex-col overflow-hidden rounded-lg"
                  >
                    <CardHeader
                      className=" cursor-pointer"
                      onClick={() => {
                        setClicked(true);
                        setCardId(route.id);
                        setEditing(false);
                      }}
                    >
                      <CardTitle>
                        {route.origin + " -> " + route.destiny}
                      </CardTitle>
                      <CardDescription>
                        {"Saída: " + route.departure_time}{" "}
                      </CardDescription>
                      <CardDescription>
                        {" "}
                        {"Chegada: " + route.arrival_time}
                      </CardDescription>
                    </CardHeader>
                    <div className="grid grid-cols-2">
                      {clicked && route.id === cardId && (
                        <Button
                          variant={"ghost"}
                          className="w-full max-w-xl mx-auto"
                          onClick={async () => {
                            setEditing(true);
                          }}
                        >
                          Editar
                        </Button>
                      )}
                      {clicked && route.id === cardId && (
                        <ConfirmDeleteDialog
                          onConfirm={async () => {
                            await DeleteRoute(cardId);
                            if (onRefresh) {
                              onRefresh();
                            }
                            setClicked(false);
                            setCardId(-1);
                          }}
                        />
                      )}
                    </div>
                  </Card>
                </div>
              )}
            </>
            <>
              {editing && cardId === route.id && (
                <RouteForm
                  onSend={async (values: CreateRouteValues) => {
                    await UpdateRoute(route.id, values);
                    setClicked(false);
                    setCardId(-1);
                    setEditing(false);
                    if (onRefresh) {
                      onRefresh();
                    }
                  }}
                  routeValues={route}
                  title="Atualizar Rota"
                  buttonCaptionLoad="Enviando"
                  buttonCaption="Enviar"
                />
              )}
            </>
          </>
        ))}
      </>
    );
  }
  return (
    <>
      <p className="text-center text-sm sm:text-base font-heading">
        Nenhuma rota disponível
      </p>
    </>
  );
}
