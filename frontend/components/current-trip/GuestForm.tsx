import { apiFetch } from "@/lib/api";
import { Button } from "@/lib/ui/button";
import { FieldLabel } from "@/lib/ui/field";
import { Input } from "@/lib/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

const normalizeCpf = (value: string | undefined) => {
  if (!value) return "";
  return value
    .replace(/[\D]/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
};

const guestSchema = z.object({
  full_name: z.string().nonempty("Informe o nome completo"),
  cpf: z
    .string()
    .refine(
      (val) => val.replace(/\D/g, "").length === 11,
      "CPF deve ter exatamente 11 números."
    ),
  trip: z.string(),
});

type GuestSchema = z.infer<typeof guestSchema>;

type Props = {
  tripId: string;
  onGuestAdded: () => void;
};

export function GuestForm({ tripId, onGuestAdded }: Props) {
  const [isAdding, setIsAdding] = useState(false);

  const guestForm = useForm<GuestSchema>({
    resolver: zodResolver(guestSchema),
    mode: "onChange",
    defaultValues: {
      trip: tripId,
      full_name: "",
      cpf: "",
    },
  });

  const { onChange: formOnChange, ...cpfRest } = guestForm.register("cpf");

  const addGuestMutation = useMutation({
    mutationFn: async (payload: GuestSchema) => {
      return apiFetch("/trips/guest/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      guestForm.reset();
      setIsAdding(false);
      onGuestAdded();
    },
    onError: (error) => {
      const errorData = error as { data?: { cpf?: string[] } };
      if (errorData.data?.cpf) {
        guestForm.setError("cpf", {
          type: "server",
          message: "Esse convidado já foi adicionado para essa viagem",
        });
      }
    },
  });

  const onSubmit = (data: GuestSchema) => {
    const payload = {
      ...data,
      cpf: data.cpf.replace(/\D/g, ""), 
    };
    addGuestMutation.mutate(payload);
  };

  return (
    <>
      {!isAdding && (
        <Button className="w-full" onClick={() => setIsAdding(true)}>
          Adicionar Convidado
        </Button>
      )}
      {isAdding && (
        <form
          className="p-4 shadow-md rounded-4xl border space-y-4"
          onSubmit={guestForm.handleSubmit(onSubmit)}
          onReset={() => {
            setIsAdding(false);
            guestForm.reset();
          }}
        >
          <h1 className="text-center text-3xl sm:text-4xl font-heading font-medium">
            Informações do Convidado
          </h1>
          
          <div className="space-y-1">
            <FieldLabel>Nome do convidado:</FieldLabel>
            <Input
              placeholder="Nome Completo"
              {...guestForm.register("full_name")}
            />
            {guestForm.formState.errors.full_name && (
              <p className="text-red-500 text-sm font-medium">
                {guestForm.formState.errors.full_name.message}
              </p>
            )}
          </div>
          
          <div className="space-y-1">
            <FieldLabel>CPF do convidado:</FieldLabel>
            <Input 
              placeholder="000.000.000-00" 
              maxLength={14}
              {...cpfRest}
              onChange={(e) => {
                e.target.value = normalizeCpf(e.target.value);
                formOnChange(e); 
              }}
            />
            {guestForm.formState.errors.cpf && (
              <p className="text-red-500 text-sm font-medium">
                {guestForm.formState.errors.cpf.message}
              </p>
            )}
          </div>
          
          <div className="grid gap-2 grid-cols-2 pt-2">
            <Button className="w-full" variant="ghost" type="reset">
              Cancelar
            </Button>
            <Button className="w-full" type="submit" disabled={addGuestMutation.isPending}>
              {addGuestMutation.isPending ? "Adicionando..." : "Adicionar"}
            </Button>
          </div>
        </form>
      )}
    </>
  );
}