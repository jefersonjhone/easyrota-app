import { apiFetch } from "@/lib/api";
import AppLayout from "@/lib/layout/app-layout";
import { Card, CardContent } from "@/lib/ui/card";
import { FieldDescription, FieldLabel } from "@/lib/ui/field";
import PassengerQRCode from "@/lib/ui/qr-code";
import { useEffect, useState } from "react";

type GuestData = {
  id: string;
  cpf: number;
  full_name: string;
  email: string;
  origin: string;
  destiny: string;
  departure_time: string;
  arrival_time: string;
  invited_by: string;
  trip_date: string;
};

type GuestProps = {
  guest_id?: string;
};

export function GuestPage({ guest_id }: GuestProps) {
  const [guestData, setGuestData] = useState<GuestData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await apiFetch<GuestData>(
          "/trips/guest/" + guest_id + "/",
        );
        setGuestData(data);
      } catch (err) {
        console.error("Erro ao carregar informações do convidado:", err);

        const errorData = err as { data?: { detail?: string } } | undefined;
        const detail = errorData?.data?.detail;
        const message =
          detail || "Não foi possível carregar seus dados no momento.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    if (guest_id) {
      loadData();
    }
  }, [guest_id]);

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <header className="mb-8 space-y-2">
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
            Informações da Viagem
          </p>
        </header>

        {error ? (
          <FieldDescription className="mb-6 rounded-md bg-red-50 p-4 text-red-700">
            {error}
          </FieldDescription>
        ) : null}

        {isLoading ? (
          <div className="rounded-4xl border border-dashed border-border bg-muted/30 p-8 text-center text-muted-foreground">
            Carregando, aguarde...
          </div>
        ) : guestData ? (
          <Card>
            <CardContent className="flex flex-col pt-6 pb-6 gap-5">
              <CardContent className="flex flex-col items-center justify-center pt-6 pb-6 gap-5">
                <PassengerQRCode identifier={guestData.id} />
              </CardContent>
              <section className="grid grid-rows-3 grid-cols-2 gap-4">
                <section>
                  <FieldLabel className="text-sm text-slate-500">Origem:</FieldLabel>
                  <FieldLabel>{guestData.origin}</FieldLabel>
                </section>
                <section>
                  <FieldLabel className="text-sm text-slate-500">Destino:</FieldLabel>
                  <FieldLabel>{guestData.destiny}</FieldLabel>
                </section>
                <section>
                  <FieldLabel className="text-sm text-slate-500">Horário de saída:</FieldLabel>
                  <FieldLabel>{guestData.departure_time}</FieldLabel>
                </section>
                <section>
                  <FieldLabel className="text-sm text-slate-500">Horário de chegada:</FieldLabel>
                  <FieldLabel>{guestData.arrival_time}</FieldLabel>
                </section>
                <section>
                  <FieldLabel className="text-sm text-slate-500">Convidado por:</FieldLabel>
                  <FieldLabel>{guestData.invited_by}</FieldLabel>
                </section>
                <section>
                  <FieldLabel className="text-sm text-slate-500">Dia da Viagem:</FieldLabel>
                  <FieldLabel>{guestData.trip_date}</FieldLabel>
                </section>
              </section>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AppLayout>
  );
}
