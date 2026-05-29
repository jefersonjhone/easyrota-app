import { apiFetch } from "@/lib/api";
import { Button } from "@/lib/ui/button";
import { FieldLabel } from "@/lib/ui/field";
import { Input } from "@/lib/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

const guestSchema = z.object({
  full_name: z.string().nonempty("Informe o nome completo"),
  cpf: z
    .string()
    .length(11, "CPF deve ter 11 números.")
    .regex(/^\d+$/, "CPF deve conter apenas números."),
  trip: z.number(),
});

type GuestSchema = z.infer<typeof guestSchema>;

type Props = {
  tripId: number;
};

export function GuestForm({ tripId }: Props) {
  const [isAdding, setIsAdding] = useState(false);

  const guestForm = useForm<GuestSchema>({
    resolver: zodResolver(guestSchema),
    mode: "onChange",
  });
  guestForm.setValue("trip", tripId);
  // adcionando convidado:
  const addGuestMutation = useMutation({
    mutationFn: async (payload: GuestSchema) => {
      return apiFetch("/trips/guest/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      guestForm.reset({
        full_name: "",
        cpf: "",
      });
      setIsAdding(false);
    },
    onError: (error) => {
      const errorData = error as {
        data?: {
          cpf?: string[];
        };
      };
      if (errorData.data?.cpf) {
        guestForm.setError("cpf", {
          type: "server",
          message: "Esse convidado já foi adicionado para essa viagem",
        });
      }
    },
  });

  const onSubmit = (data: GuestSchema) => {
    addGuestMutation.mutate(data);
  };

  return (
    <>
      {!isAdding && (
        <Button className="w-full space-y-6" onClick={() => setIsAdding(true)}>
          Adicionar Convidado
        </Button>
      )}
      {isAdding && (
        <form
          className="p-4 shadow-md rounded-4xl border space-y-3"
          onSubmit={guestForm.handleSubmit(onSubmit)}
          onReset={() => {
            setIsAdding(false);
          }}
        >
          <h1 className="text-center text-3xl sm:text-4xl font-heading font-medium">
            Informações do Convidado
          </h1>
          <div className="space-y-1 ">
            <FieldLabel>Nome do convidado:</FieldLabel>
            <Input
              placeholder="Nome Completo"
              required
              {...guestForm.register("full_name")}
            />
          </div>
          <div className="space-y-1">
            <FieldLabel>CPF do convidado:</FieldLabel>
            <Input placeholder="CPF" required {...guestForm.register("cpf")} />
          </div>
          <div className="grid gap-2 grid-cols-2">
            <Button className="w-full" variant={"ghost"} type="reset">
              Cancelar
            </Button>
            <Button className="w-full" type={"submit"}>
              Adcionar
            </Button>
          </div>
        </form>
      )}
    </>
  );
}
