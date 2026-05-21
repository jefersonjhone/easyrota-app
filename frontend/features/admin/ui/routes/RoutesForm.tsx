import { Field, FieldLabel } from "@/lib/ui/field";
import { Button } from "@ui/button";
import { Separator } from "@ui/separator";
import { Input } from "@/lib/ui/input";
import { useCreateRouteMutation } from "@features/admin/hooks/useRoutes";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import HintInvalid from "@/features/auth/ui/HintInvalid";

const schema = z.object({
  origin: z.string().nonempty("Informe a origem"),
  destiny: z.string().nonempty("Informe o destino"),
  departure_time: z.string().nonempty("Informe o horário de saída"),
  arrival_time: z.string().nonempty("Informe o horário de saída"),
});

type Schema = z.infer<typeof schema>;

type Props = {
  onSuccess?: () => void;
};

export function RouteForm({ onSuccess }: Props) {
  const createRouteMutation = useCreateRouteMutation();
  const form = useForm<Schema>({
    mode: "onChange",
    resolver: zodResolver(schema),
    defaultValues: {
      origin: "",
      destiny: "",
      departure_time: "",
      arrival_time: "",
    },
  });

  const { register, handleSubmit, formState: state } = form;
  const isSubmitting = state.isSubmitting || createRouteMutation.isPending;

  const onSubmit = async (data: Schema) => {
    await createRouteMutation.mutateAsync(data);
    if (onSuccess) {
      onSuccess();
    }
  };

  if (createRouteMutation.isSuccess) {
    alert("Rota Criada!");
  }

  return (
    <>
      <h1 className="text-center text-2xl font-heading font-medium">
        Configurar Nova Rota
      </h1>
      <Separator className="max-w-xl mx-auto " />
      <Field className="px-4 text-2xl">
        <form id="createRoute" onSubmit={handleSubmit(onSubmit)}>
          <section >
            <FieldLabel>PONTO DE PARTIDA</FieldLabel>
            <Input
              id="origin"
              placeholder="Local de saída"
              required
              {...register("origin")}
            ></Input>
            <HintInvalid for={state.errors.origin} />
          </section>
          <FieldLabel>DESTINO</FieldLabel>
          <Input
            id="destiny"
            placeholder="Local de chegada"
            required
            {...register("destiny")}
          ></Input>
          <HintInvalid for={state.errors.destiny} />
          <section className="grid  grid-cols-2 gap-2">
            <section>
              <FieldLabel>HORÁRIO DE SAIDA (HORAS:MINUTOS)</FieldLabel>
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
              <FieldLabel>HORÁRIO DE CHEGADA (HORAS:MINUTOS)</FieldLabel>
              <Input
                id="arrival_time"
                type="time"
                step="60"
                placeholder="Ex: 10:30 AM"
                required
                {...register("arrival_time")}
              ></Input>
              <HintInvalid for={state.errors.arrival_time} />
            </section>
          </section>
        </form>
        <Button
          form="createRoute"
          type="submit"
          className="w-full cursor-pointer"
          disabled={isSubmitting}
        >
          {isSubmitting ? "PUBLICANDO..." : "PUBLICAR ROTA NO SISTEMA"}
        </Button>
      </Field>
    </>
  );
}
