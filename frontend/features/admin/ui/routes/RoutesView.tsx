import type { RouteValues } from "@/features/admin/hooks/useRoutes";
import { Button } from "@/lib/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/lib/ui/card";
import { useState } from "react";
import { DeleteRoute } from "../../services/RoutesRequests";

type Props = {
  routes: RouteValues[];
  onRefresh?: () => void;
};

export function RoutesView({ routes, onRefresh }: Props) {
  const [clicked, setClicked] = useState(false);
  const [cardId, setCardId] = useState(-1);
  if (routes.length > 0) {
    return (
      <>
        {routes.map((route: RouteValues) => (
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
                }}
              >
                <CardTitle>{route.origin + " -> " + route.destiny}</CardTitle>
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
                    className="w-full max-w-xl mx-auto "
                    onClick={async () => {
                      const resp = confirm(
                        "Tem certeza que quer apagar a rota?",
                      );
                      if (resp) {
                        await DeleteRoute(cardId);
                        if (onRefresh) {
                          onRefresh();
                        }
                      }
                      setClicked(false);
                      setCardId(-1);
                    }}
                  >
                    Editar
                  </Button>
                )}
                {clicked && route.id === cardId && (
                  <Button
                    className="w-full max-w-xl mx-auto bg-destructive hover:bg-destructive/80"
                    onClick={async () => {
                      const resp = confirm(
                        "Tem certeza que quer apagar a rota?",
                      );
                      if (resp) {
                        await DeleteRoute(cardId);
                        if (onRefresh) {
                          onRefresh();
                        }
                      }
                      setClicked(false);
                      setCardId(-1);
                    }}
                  >
                    Apagar
                  </Button>
                )}
              </div>
            </Card>
          </div>
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
