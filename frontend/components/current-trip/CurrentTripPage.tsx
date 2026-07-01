import { useState, useEffect } from "react";
import { BusIcon, InfoIcon } from "@phosphor-icons/react";

import AppLayout from "@/lib/layout/app-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/lib/ui/card";
import { FieldDescription, FieldLabel } from "@/lib/ui/field";
import { Separator } from "@/lib/ui/separator";
import { apiFetch } from "@/lib/api";
import { formatTripDate } from "@/features/user-home/config";
import PassengerQRCode from "@/lib/ui/qr-code";
import { GuestForm } from "@/components/utils/GuestForm";
import { Dialog, DialogContent, DialogTrigger } from "@/lib/ui/dialog";
import { Textarea } from "@/lib/ui/textarea";
import { Button } from "@/lib/ui/button";

type PassengerGuest = {
  id: string;
  cpf: string;
  full_name: string;
  passenger_identifier: string;
};

type CurrentTripData = {
  id: string;
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
  has_checked_in: boolean;
  passenger_guests: PassengerGuest[];
};

function getErrorMessage(detail?: string) {
  if (!detail)
    return "Não foi possível carregar os dados da viagem atual.";

  if (detail.includes("Given token not valid"))
    return "Token inválido. Faça login novamente.";

  if (detail.includes("Token is invalid"))
    return "Token inválido ou expirado. Faça login novamente.";

  if (detail.includes("Authentication credentials"))
    return "Faça login para acessar esse recurso.";

  if (detail.includes("Nenhuma viagem"))
    return "Você não tem nenhuma viagem próxima agendada.";

  return detail;
}

export function CurrentTripPage() {
  const [trip, setTrip] = useState<CurrentTripData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [addedGuest, setAddedGuest] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showMinutesCard = trip !== null && trip.minutes_remaining !== null;
  const isTripInProgress = trip?.status_trip?.toLowerCase() === "em andamento";
  const percentage = Math.min(
    100,
    Math.max(0, trip?.percentage_complete ?? 0)
  );

  const [refreshKey, setRefreshKey] = useState(0);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const isAtRisk = trip?.status_trip?.toLowerCase().includes("risco de cancelamento");
  
  useEffect(() => {
    if (!isTripInProgress) return;

    const intervalId = setInterval(() => {
      setRefreshKey((old) => old + 1);
    }, 60000);

    return () => clearInterval(intervalId);
  }, [isTripInProgress]);

  useEffect(() => {
    const loadCurrentTrip = async () => {
      setError(null);

      if (refreshKey === 0) {
        setIsLoading(true);
      }

      try {
        const data = await apiFetch(`/trips/current/`);
        setTrip(data as CurrentTripData);
      } catch (err) {
        console.error("Erro ao carregar viagem atual:", err);
        const errorData = err as { data?: { detail?: string } } | undefined;
        const detail = errorData?.data?.detail;

        setError(getErrorMessage(detail));
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCurrentTrip();
  }, [refreshKey]);

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

            {!isTripInProgress && (
              <>
                <Card className="rounded-xl border overflow-hidden bg-white shadow-sm">
                  <CardContent className="flex flex-col items-center justify-center pt-6 pb-6 gap-5">
                    <PassengerQRCode identifier={trip.passenger_identifier} />

                    {trip.has_checked_in ? (
                      <span className="px-4 py-1.5 rounded-full bg-green-100 text-green-800 text-sm font-semibold border border-green-200 flex items-center gap-2">
                        Check-in Realizado
                      </span>
                    ) : (
                      <span className="px-4 py-1.5 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold border border-amber-200 flex items-center gap-2">
                        Check-in Pendente
                      </span>
                    )}
                  </CardContent>
                </Card>

                {trip.passenger_guests.length > 0 && (
                  <Card className="rounded-xl border overflow-hidden bg-white shadow-sm">
                    <div 
                      className={`grid grid-cols-1 ${
                        trip.passenger_guests.length === 1 
                          ? "" 
                          : "sm:grid-cols-2 sm:divide-y-0 sm:divide-x"
                      } divide-y`}
                    >
                      {trip.passenger_guests.map((guest: PassengerGuest) => (
                        <div key={guest.id} className="flex flex-col items-center justify-center p-6 gap-4">
                          <PassengerQRCode identifier={guest.passenger_identifier} />
                          
                          <div className="text-center space-y-1">
                            <FieldLabel className="text-base text-center w-full block">{guest.full_name}</FieldLabel>
                            <p className="text-sm text-slate-500 font-medium text-center w-full">{guest.cpf}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            )}

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
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold">{trip.status_trip}</p>
                      {isAtRisk && (
                        <button 
                          type="button" 
                          className="group relative flex cursor-pointer items-center focus:outline-none"
                          onClick={() => setIsTooltipOpen((prev) => !prev)}
                          onBlur={() => setIsTooltipOpen(false)}
                          onMouseLeave={() => setIsTooltipOpen(false)}
                        >
                          <InfoIcon 
                            weight="fill" 
                            className="size-6 grid place-items-center rounded-full border border-orange-200 bg-white text-orange-500 shadow-sm drop-shadow" 
                            />
                          
                          <div 
                            className={`absolute bottom-full -right-4 z-50 mb-2 w-[160px] rounded-md bg-slate-800 px-3 py-2 text-center text-xs font-medium leading-snug text-white shadow-lg sm:right-auto sm:left-1/2 sm:-translate-x-1/2 ${
                              isTooltipOpen ? "block" : "hidden sm:group-hover:block"
                            }`}
                          >
                            Quórum insuficiente,
                            <br />
                            Falta 1 servidor.
                            <span 
                              className="absolute right-6 top-full border-[5px] border-transparent border-t-slate-800 sm:left-1/2 sm:right-auto sm:-translate-x-1/2" 
                              />
                          </div>
                        </button>
                      )}
                    </div>

                    <p className="text-sm text-slate-500">Ônibus</p>
                    <p className="text-lg font-semibold">
                      {trip.bus_number_plate}
                    </p>

                    <p className="text-sm text-slate-500">Motorista</p>
                    <p className="text-lg font-semibold">{trip.driver}</p>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="mb-6 px-2">
                  <p className="text-sm text-slate-500 mb-3">Progresso da viagem</p>
                  <div className="relative h-14">
                    <div className="absolute top-1/2 left-0 right-0 h-2.5 -translate-y-1/2 rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-orange-400 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-500"
                      style={{ left: `clamp(1.5rem, ${percentage}%, calc(100% - 1.5rem))` }}
                    >
                      <span className="grid size-11 place-items-center rounded-full border border-orange-200 bg-white text-orange-500 shadow-sm drop-shadow">
                        <BusIcon aria-hidden="true" weight="fill" className="size-7" />
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-slate-500 mt-1">
                    <span>{trip.origin}</span>
                    <span className="font-semibold text-orange-500">{percentage}%</span>
                    <span>{trip.destiny}</span>
                  </div>
                </div>

                <div
                  className={`grid gap-4 items-stretch ${showMinutesCard ? "md:grid-cols-2" : "md:grid-cols-1"}`}
                >
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
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="w-full" onClick={() => {setAddedGuest(false)}}>Adicionar Convidado</Button>
                        </DialogTrigger>
                        <DialogContent>
{!addedGuest && (<GuestForm tripId={trip.id} onGuestAdded={() => {setAddedGuest(true)}} />)}
{addedGuest && (<Textarea className="color-green text-center">Convidado Adicionado!</Textarea>)}
                        </DialogContent>
                      </Dialog>
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
