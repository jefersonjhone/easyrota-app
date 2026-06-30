import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/lib/ui/field";
import { Button } from "@ui/button";
import { Input } from "@/lib/ui/input";
import { toast } from 'sonner'
import {
  useCreateRouteMutation,
  type RouteValues,
} from "@features/admin/hooks/useRoutes";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { CreateRouteValues } from "../../services/RoutesRequests";

const schema = z.object({
  origin: z.string().nonempty("Informe a origem"),
  destiny: z.string().nonempty("Informe o destino"),
  departure_time: z.string().nonempty("Informe o horário de saída"),
  arrival_time: z.string().nonempty("Informe o horário de chegada"),
  max_bus: z.string().nonempty("Informe a quantidade de onibus disponiveis"),
});

type Schema = z.infer<typeof schema>;

type Props = {
  onCreate?: () => void;
  title?: string;
  routeValues?: RouteValues;
  buttonCaption?: string;
  buttonCaptionLoad?: string;
  onSend?: (values: CreateRouteValues) => void;
};

export function RouteForm({
  onCreate,
  routeValues,
  buttonCaption,
  buttonCaptionLoad,
  onSend,
}: Props) {
  const createRouteMutation = useCreateRouteMutation();
  const form = useForm<Schema>({
    mode: "onChange",
    resolver: zodResolver(schema),
    defaultValues: {
      origin: routeValues ? routeValues.origin : "",
      destiny: routeValues ? routeValues.destiny : "",
      departure_time: routeValues ? routeValues.departure_time : "",
      arrival_time: routeValues ? routeValues.arrival_time : "",
      max_bus: routeValues ? routeValues.max_bus.toString() : '1',
    },
  });

  const { register, handleSubmit, formState: state } = form;
  const isSubmitting = state.isSubmitting || createRouteMutation.isPending;

  const submitForm = async (data: Schema) => {
    console.log("submitting....");
    try {
        const max_bus = /^[0-9]+$/.test(data.max_bus) ? Number(data.max_bus) : 0
        const values: CreateRouteValues = {
          origin: data.origin,
          destiny: data.destiny,
          departure_time: data.departure_time,
          arrival_time: data.arrival_time,
          max_bus: max_bus,
        };
      if (onSend) {
        console.log("trying to send");
        onSend(values);
      } else {
        console.log("using mutation to create route")
        await createRouteMutation.mutateAsync(values);
      }

      if (onCreate) {
        onCreate();
      }

      toast.success('Rota criada com sucesso!');
    } catch (error) {
      const err = error as {
        data?: Record<string, string | string[]>;
        response?: {
          data?: Record<string, string | string[]>;
        };
      };

      const errorData = err.data || err.response?.data;

      if (errorData) {
        if (errorData.destiny) {
          const message = Array.isArray(errorData.destiny)
            ? errorData.destiny[0]
            : errorData.destiny;
          form.setError("destiny", { type: "server", message });
        }

        if (errorData.arrival_time) {
          const message = Array.isArray(errorData.arrival_time)
            ? errorData.arrival_time[0]
            : errorData.arrival_time;
          form.setError("arrival_time", { type: "server", message });
        }

        if (errorData.origin) {
          const message = Array.isArray(errorData.origin)
            ? errorData.origin[0]
            : errorData.origin;
          form.setError("origin", { type: "server", message });
        }
        if (errorData.max_bus) {
          const message = Array.isArray(errorData.max_bus)
            ? errorData.max_bus[0]
            : errorData.max_bus;
          form.setError("max_bus", { type: "server", message });
        }
      } else {
        toast.error('Erro inesperado ao criar rota.');
        console.error("Erro inesperado ao criar rota:", error);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="origin" className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Origem</FieldLabel>
          <Input
            id="origin"
            placeholder="Local de partida"
            className="h-8 rounded-md border-border bg-card px-2.5 text-xs focus-visible:ring-2"
            {...register("origin")}
          />
          {state.errors.origin && (
            <FieldDescription className="text-red-500">
              {state.errors.origin.message}
            </FieldDescription>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="destiny" className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Destino</FieldLabel>
          <Input
            id="destiny"
            placeholder="Local de chegada"
            className="h-8 rounded-md border-border bg-card px-2.5 text-xs focus-visible:ring-2"
            {...register("destiny")}
          />
          {state.errors.destiny && (
            <FieldDescription className="text-red-500">
              {state.errors.destiny.message}
            </FieldDescription>
          )}
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="departure_time" className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Horário de saída</FieldLabel>
            <Input
              id="departure_time"
              type="time"
              step="60"
              className="h-8 rounded-md border-border bg-card px-2.5 text-xs focus-visible:ring-2"
              {...register("departure_time")}
            />
            {state.errors.departure_time && (
              <FieldDescription className="text-red-500">
                {state.errors.departure_time.message}
              </FieldDescription>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="arrival_time" className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Horário de chegada</FieldLabel>
            <Input
              id="arrival_time"
              type="time"
              step="60"
              className="h-8 rounded-md border-border bg-card px-2.5 text-xs focus-visible:ring-2"
              {...register("arrival_time")}
            />
            {state.errors.arrival_time && (
              <FieldDescription className="text-red-500">
                {state.errors.arrival_time.message}
              </FieldDescription>
            )}
          </Field>
        
        </div>

        <Field>
          <Button type="submit" className="cursor-pointer" disabled={isSubmitting}>
            {isSubmitting
              ? buttonCaptionLoad || "Salvando..."
              : buttonCaption || "Criar rota"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
