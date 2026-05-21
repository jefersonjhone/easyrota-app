import type { RouteValues } from "@/features/admin/hooks/useRoutes";
import { Card, CardDescription, CardHeader, CardTitle } from "@/lib/ui/card";
import { Separator } from "@/lib/ui/separator";

type Props = {
  routes: RouteValues[];
};

export function RoutesView({ routes }: Props) {
  if (routes.length > 0) {
    return (
      <>
        {routes.map((route: RouteValues) => (
          <Card
            key={route.origin + "->" + route.destiny}
            className="flex flex-col overflow-hidden rounded-lg"
          >
            <CardHeader>
              <CardTitle>{route.origin + " -> " + route.destiny}</CardTitle>
              <CardDescription>
                {"Saída: " + route.departure_time}{" "}
              </CardDescription>
              <CardDescription>
                {" "}
                {"Chegada: " + route.arrival_time}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </>
    );
  }
  return (
    <>
      <h1 className="text-center text-3xl sm:text-4xl font-heading font-medium">
        Rotas
      </h1>
      <Separator className="max-w-xl mx-auto" />
      <p className="text-center text-sm sm:text-base font-heading">
        Nenhuma rota disponível
      </p>
    </>
  );
}
