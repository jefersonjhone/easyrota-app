import { Field, FieldLabel } from "@/lib/ui/field";
import { Button } from "@ui/button";
import { Separator } from "@ui/separator";
import { Input } from "@/lib/ui/input";
import {
  useCreateRouteMutation,
  type RouteValues,
} from "@features/admin/hooks/useRoutes";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import HintInvalid from "@/features/auth/ui/HintInvalid";
import type { CreateRouteValues } from "../../services/RoutesRequests";

const schema = z.object({
  origin: z.string().nonempty("Informe a origem"),
  destiny: z.string().nonempty("Informe o destino"),
  departure_time: z.string().nonempty("Informe o horário de saída"),
  arrival_time: z.string().nonempty("Informe o horário de saída"),
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
  title,
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
          form.setError("origin", { type: "server", message });
        }
      } else {
        console.error("Erro inesperado ao criar rota:", error);
      }
    }
  };

  return (
    <>
      <h1 className="text-center text-2xl font-heading font-medium">
        {title ? title : "Configurar Nova Rota"}
      </h1>
      <Separator className="max-w-xl mx-auto " />
      <Field className="px-4 text-2xl">
        <form id="createRoute" onSubmit={handleSubmit(submitForm)}>
          <section>
            <FieldLabel>PONTO DE PARTIDA</FieldLabel>
            <Input
              id="origin"
              placeholder="Local de saída"
              required
              {...register("origin")}
            ></Input>
            <HintInvalid for={state.errors.origin} />
          </section>
          <section>
            <FieldLabel>DESTINO</FieldLabel>
            <Input
              id="destiny"
              placeholder="Local de chegada"
              required
              {...register("destiny")}
            ></Input>
            <HintInvalid for={state.errors.destiny} />
          </section>
          <section className="grid  grid-cols-3 gap-2">
            <section>
              <FieldLabel>HORÁRIO DE SAIDA</FieldLabel>
              <Input
                id="departure_time"
                type="time"
                step="60"
                placeholder="Ex: 08:28 PM"
                required
                {...register("departure_time")}
              ></Input>
              <HintInvalid for={state.errors.departure_time} />
            </section>
            <section>
              <FieldLabel>HORÁRIO DE CHEGADA</FieldLabel>
              <Input
                id="arrival_time"
                type="time"
                step="60"
                placeholder="Ex: 10:30 AM"
                defaultValue={routeValues ? routeValues.arrival_time : ""}
                required
                {...register("arrival_time")}
              ></Input>
              <HintInvalid for={state.errors.arrival_time} />
            </section>
            <section>
              <FieldLabel>ÔNIBUS DISPONÍVEIS</FieldLabel>
              <Input
                id="max_bus"
                type="number"
                required
                {...register("max_bus")}
              ></Input>
            </section>
          </section>
        <Button
          type="submit"
          className="w-full cursor-pointer"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? buttonCaptionLoad
              ? buttonCaptionLoad
              : "PUBLICANDO..."
            : buttonCaption
              ? buttonCaption
              : "PUBLICAR ROTA NO SISTEMA"}
        </Button>
        </form>
      </Field>
    </>
  );
}
