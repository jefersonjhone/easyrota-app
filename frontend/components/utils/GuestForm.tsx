import { apiFetch } from "@/lib/api";
import { Button } from "@/lib/ui/button";
import { FieldLabel } from "@/lib/ui/field";
import { Input } from "@/lib/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
  email: z.email("Informe um Email válidgo"),
  cpf: z
    .string()
    .refine(
      (val) => val.replace(/\D/g, "").length === 11,
      "CPF deve ter exatamente 11 números.",
    ),
  trip: z.string(),
});

type GuestSchema = z.infer<typeof guestSchema>;

type Props = {
  tripId: string;
  onGuestAdded: () => void;
};

export function GuestForm({ tripId, onGuestAdded }: Props) {

  const guestForm = useForm<GuestSchema>({
    resolver: zodResolver(guestSchema),
    mode: "onChange",
    defaultValues: {
      trip: tripId,
      full_name: "",
      cpf: "",
      email: "",
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
      toast.success("Convidado cadastrado com sucesso!");
      onGuestAdded();
    },
    onError: (error) => {
      const errorData = error as { data?: { cpf?: string[] } };
      if (errorData.data?.cpf) {
        guestForm.setError("cpf", {
          type: "server",
          message: "Esse convidado já foi adicionado para essa viagem",
        });
        toast.error("Esse convidado ja foi adicionado para essa viagem.");
        return;
      }
      toast.error("Erro ao cadastrar convidado.");
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
        <form
          className="p-4 shadow-md rounded-4xl border space-y-4"
          onSubmit={guestForm.handleSubmit(onSubmit)}
          onReset={() => {
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

          <section className="grid grid-cols-2 gap-2">
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
            <div>
              <FieldLabel>Email do Convidado</FieldLabel>
              <Input placeholder="fulano@gmail.com" {...guestForm.register("email")}/>
              {guestForm.formState.errors.email && (
                <p className="text-red-500 text-sm font-medium">
                  {guestForm.formState.errors.email.message}
                </p>
              )}
            </div>
          </section>

          <div className="grid gap-2 grid-cols-2 pt-2">
            <Button className="w-full" variant="ghost" type="reset">
              Cancelar
            </Button>
            <Button
              className="w-full"
              type="submit"
              disabled={addGuestMutation.isPending}
            >
              {addGuestMutation.isPending ? "Adicionando..." : "Adicionar"}
            </Button>
          </div>
        </form>
    </>
  );
}
