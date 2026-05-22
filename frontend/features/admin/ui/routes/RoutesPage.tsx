// Components
import { useShowRoutes } from "@/features/admin/hooks/useRoutes";
import { AdminLayout } from '@/features/admin/ui/Layout'
import { RoutesView } from "./RoutesView";
import { RouteForm } from "./RoutesForm";
import { Card } from "@/lib/ui/card";
import { Button } from "@/lib/ui/button";
import { useState } from "react";
import { Separator } from "@/lib/ui/separator";

export default function RoutesPage() {
  const [creating, setCreating] = useState(false);
  const { data, refetch } = useShowRoutes();

  console.log(data);
  return (
    <AdminLayout>
      <h1 className="text-center text-3xl sm:text-4xl font-heading font-medium">
        Rotas
      </h1>
      <Separator className="max-w-xl mx-auto" />
      <section className="mx-auto grid w-full max-w-3xl grid-cols-1 sm:grid-cols-1 gap-4 px-4 sm:px-0">
        {creating && (
          <Card className="flex flex-col overflow-hidden rounded-lg margin-auto max-w-3xl">
            <RouteForm
              onCreate={() => {
                refetch();
                setCreating(false);
              }}
            />
          </Card>
        )}
        {!creating && (
          <Button className="w-full"
            onClick={() => {
              setCreating(true);
            }}
          >
            Criar rota
          </Button>
        )}
        <section className="mx-auto grid w-full max-w-7xl grid-cols-1 sm:grid-cols-1 gap-4 px-4 sm:px-0">
          <RoutesView routes={data} onRefresh={() => {refetch()}} onInteract={()=>{setCreating(false)}}/>
        </section>
      </section>
    </AdminLayout>
  );
}
