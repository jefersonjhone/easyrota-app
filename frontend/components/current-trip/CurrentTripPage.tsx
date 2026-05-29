import { useState, useEffect } from "react";

import AppLayout from "@/lib/layout/app-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/lib/ui/card";
import { FieldDescription } from "@/lib/ui/field";
import { Separator } from "@/lib/ui/separator";
import { apiFetch } from "@/lib/api";
import { formatTripDate } from "@/features/user-home/config";
import PassengerQRCode from "@/lib/ui/qr-code";
import { GuestForm } from "./GuestForm";

type CurrentTripData = {
  id: number;
  trip_date: string;
  origin: string;
  destiny: string;
  departure_time: string;
  arrival_time: string;
  status_trip: string;
  bus_number_plate: string;
  driver: string;
  percentage_complete: number;
  minutes_remaining: number | null;
  status_route: string;
  passenger_identifier: string;
};

export function CurrentTripPage() {
  const [trip, setTrip] = useState<CurrentTripData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showMinutesCard = trip !== null && trip.minutes_remaining !== null;

  useEffect(() => {
    const loadCurrentTrip = async () => {
      setError(null);
      setIsLoading(true);

      try {
        const data = await apiFetch(`/trips/current/`);
        setTrip(data as CurrentTripData);
      } catch (err) {
        console.error("Erro ao carregar viagem atual:", err);
        const errorData = err as { data?: { detail?: string } } | undefined;
        const detail = errorData?.data?.detail;

        const message =
          (detail &&
            (detail.includes("Given token not valid")
              ? "Token inválido. Faça login novamente."
              : detail.includes("Token is invalid")
                ? "Token inválido ou expirado. Faça login novamente."
                : detail.includes("Authentication credentials")
                  ? "Faça login para acessar esse recurso."
                  : detail.includes("Nenhuma viagem")
                    ? "Você não tem nenhuma viagem próxima agendada."
                    : detail)) ||
          "Não foi possível carregar os dados da viagem atual.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadCurrentTrip();
  }, []);

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-heading font-semibold">Viagem Atual</h1>
          <p className="mt-2 text-slate-600">
            Acompanhe os detalhes e o progresso do seu trajeto.
          </p>
        </div>

        {error ? (
          <FieldDescription className="mb-6 rounded-md bg-red-50 p-4 text-red-700">
            {error}
          </FieldDescription>
        ) : null}

        {isLoading ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
            Carregando as informações da sua viagem...
          </div>
        ) : trip ? (
          <div className="space-y-6">
            <PassengerQRCode identifier={trip.passenger_identifier} />

            <Card className="rounded-xl border">
              <CardHeader>
                <CardTitle>Visão da viagem</CardTitle>
                <CardDescription>A sua próxima viagem será:</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3 rounded-lg bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Data da Viagem</p>
                    <p className="text-lg font-semibold">
                      {formatTripDate(trip.trip_date)}
                    </p>

                    <p className="text-sm text-slate-500">Horário da Partida</p>
                    <p className="text-lg font-semibold">
                      {trip.departure_time}
                    </p>

                    <p className="text-sm text-slate-500">Origem</p>
                    <p className="text-lg font-semibold">{trip.origin}</p>

                    <p className="text-sm text-slate-500">Destino</p>
                    <p className="text-lg font-semibold">{trip.destiny}</p>

                    <p className="text-sm text-slate-500">Hora de chegada</p>
                    <p className="text-lg font-semibold">{trip.arrival_time}</p>
                  </div>

                  <div className="space-y-3 rounded-lg bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Status da viagem</p>
                    <p className="text-lg font-semibold">{trip.status_trip}</p>

                    <p className="text-sm text-slate-500">Ônibus</p>
                    <p className="text-lg font-semibold">
                      {trip.bus_number_plate}
                    </p>

                    <p className="text-sm text-slate-500">Motorista</p>
                    <p className="text-lg font-semibold">{trip.driver}</p>
                  </div>
                </div>

                <Separator className="my-6" />

                <div
                  className={`grid gap-4 items-stretch ${showMinutesCard ? "md:grid-cols-3" : "md:grid-cols-2"}`}
                >
                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-sm text-slate-500">
                      Percentual concluído
                    </p>
                    <p className="mt-2 text-2xl font-semibold">
                      {trip.percentage_complete}%
                    </p>
                  </div>

                  {showMinutesCard && (
                    <div className="rounded-lg bg-white p-4 shadow-sm">
                      <p className="text-sm text-slate-500">
                        Minutos restantes
                      </p>
                      <p className="mt-2 text-2xl font-semibold">
                        {trip.minutes_remaining}
                      </p>
                    </div>
                  )}

                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-sm text-slate-500">Status da rota</p>
                    <p className="mt-2 text-2xl font-semibold">
                      {trip.status_route}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <GuestForm
            />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
            Nenhuma viagem para exibir no momento.
          </div>
        )}
      </div>
    </AppLayout>
  );
}
