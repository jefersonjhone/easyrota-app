import { useState, useEffect } from "react";
import { useParams, Link } from "@tanstack/react-router";
import {
  Bus,
  ArrowLeft,
  CheckCircle,
  CalendarBlank,
  Clock,
  MapPin,
  User,
  IdentificationBadge,
  WarningCircle,
} from "@phosphor-icons/react";

import { Button } from "@/lib/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/lib/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/lib/ui/dialog";
import { FieldDescription, FieldLabel } from "@/lib/ui/field";
import { Separator } from "@/lib/ui/separator";
import { formatTripDate } from "@/features/user-home/config";
import PassengerQRCode from "@/lib/ui/qr-code";
import { GuestForm } from "@/components/current-trip/GuestForm";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { fetchReservationById, cancelReservation } from "../services/reservations";
import type { ActiveReservation } from "../types";

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; classes: string }> = {
    CONFIRMADA: {
      label: "Confirmada",
      classes: "bg-primary/10 text-primary ring-primary/20",
    },
    "LISTA SECUNDÁRIA": {
      label: "Lista secundária",
      classes: "bg-amber-500/10 text-amber-700 ring-amber-600/20",
    },
    PENDENTE: {
      label: "Pendente",
      classes: "bg-muted text-muted-foreground ring-border",
    },
  };
  const c = config[status] ?? {
    label: status,
    classes: "bg-muted text-muted-foreground ring-border",
  };
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase ring-1 ${c.classes}`}
    >
      {c.label}
    </span>
  );
}

function QuorumBadge({ met }: { met: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase ring-1 ${
        met
          ? "bg-emerald-500/10 text-emerald-700 ring-emerald-600/20"
          : "bg-amber-500/10 text-amber-700 ring-amber-600/20"
      }`}
    >
      {met ? <CheckCircle size={14} weight="fill" /> : <WarningCircle size={14} weight="fill" />}
      {met ? "Atingido" : "Pendente"}
    </span>
  );
}

export function ReservationDetailPage() {
  const { id } = useParams({ from: "/app/reservas/$id" });
  const [reservation, setReservation] = useState<ActiveReservation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showMinutesCard = reservation !== null && reservation.minutes_remaining !== null;
  const user = useAuthStore((state) => state.user);
  const isTripInProgress = reservation?.status_trip?.toLowerCase() === "em andamento";
  const percentage = Math.min(100, Math.max(0, reservation?.percentage_complete ?? 0));

  const [showQrCodes, setShowQrCodes] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  useEffect(() => {
    setShowQrCodes(false);
  }, [reservation?.id]);

  useEffect(() => {
    if (!isTripInProgress) return;

    const intervalId = setInterval(() => {
      setRefreshKey((old) => old + 1);
    }, 60000);

    return () => clearInterval(intervalId);
  }, [isTripInProgress]);

  useEffect(() => {
    const loadReservation = async () => {
      setError(null);

      if (refreshKey === 0) {
        setIsLoading(true);
      }

      try {
        const data = await fetchReservationById(id);
        setReservation(data);
      } catch (err) {
        console.error("Erro ao carregar reserva:", err);
        const errorData = err as { data?: { detail?: string } } | undefined;
        const detail = errorData?.data?.detail;
        setError(detail || "Não foi possível carregar os dados da reserva.");
      } finally {
        setIsLoading(false);
      }
    };

    loadReservation();
  }, [id, refreshKey]);

  const handleCancel = async () => {
    try {
      await cancelReservation(id);
      setReservation(null);
    } catch {
      // silent
    }
  };

  return (
      <section className="mx-auto w-full max-w-4xl px-4 py-8">
        <div className="mb-4">
          <Link
            to="/app/reservas"
            className="inline-flex items-center gap-1 text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} className="md:size-[16px]" />
            Voltar para reservas
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-heading font-bold tracking-tight">
            {reservation?.origin} &rarr; {reservation?.destiny || "Detalhes da reserva"}
          </h1>
          <p className="mt-2 text-xs md:text-sm text-muted-foreground">
            Acompanhe os detalhes e o progresso do seu trajeto.
          </p>
        </div>

        {error ? (
          <FieldDescription className="mb-6 rounded-md bg-destructive/10 p-3 md:p-4 text-destructive">
            {error}
          </FieldDescription>
        ) : null}

        {isLoading ? (
          <div className="rounded-4xl border border-dashed border-border bg-muted/30 p-4 md:p-8 text-center text-xs md:text-sm text-muted-foreground">
            Carregando as informações da reserva...
          </div>
        ) : reservation ? (
          <div className="space-y-6">

            {!isTripInProgress && (
              <div className="flex justify-center sm:justify-start">
                <Button
                  className="w-full sm:w-auto font-semibold"
                  onClick={() => setShowQrCodes(!showQrCodes)}
                >
                  {showQrCodes ? "Ocultar QR Code" : "Mostrar QR Code"}
                </Button>
              </div>
            )}

            {!isTripInProgress && showQrCodes && (
              <Card className="rounded-xl border overflow-hidden bg-card shadow-sm">
                <CardContent className="flex flex-col items-center justify-center pt-6 pb-6 gap-5">
                  <PassengerQRCode identifier={reservation.passenger_identifier} />

                  {reservation.has_checked_in ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                      <CheckCircle size={14} />
                      Check-in Realizado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-600/20">
                      Check-in Pendente
                    </span>
                  )}
                </CardContent>
              </Card>
            )}

            {!isTripInProgress && showQrCodes && reservation.has_checked_in && (
              <Card className="rounded-xl border overflow-hidden bg-card shadow-sm">
                <CardContent className="flex flex-col items-center justify-center p-6 gap-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                    <CheckCircle size={14} />
                    Check-in realizado - embarque confirmado
                  </span>
                </CardContent>
              </Card>
            )}

            {!isTripInProgress && showQrCodes && reservation.passenger_guests.length > 0 && (
              <Card className="rounded-xl border overflow-hidden bg-card shadow-sm">
                <div
                  className={`grid grid-cols-1 ${
                    reservation.passenger_guests.length === 1
                      ? ""
                      : "sm:grid-cols-2 sm:divide-y-0 sm:divide-x"
                  } divide-y`}
                >
                  {reservation.passenger_guests.map((guest) => (
                    <div key={guest.id} className="flex flex-col items-center justify-center p-6 gap-4">
                      <PassengerQRCode identifier={guest.passenger_identifier} />
                      <div className="text-center space-y-1">
                        <FieldLabel className="text-base text-center w-full block">{guest.full_name}</FieldLabel>
                        <p className="text-sm text-muted-foreground font-medium text-center w-full">{guest.cpf}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card className="rounded-xl border border-border/70 bg-card">
              <CardHeader>
                <CardTitle className="text-base md:text-xl font-heading font-bold">Visão da viagem</CardTitle>
                <CardDescription className="text-xs md:text-sm">A sua reserva para:</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="rounded-2xl bg-muted/20 p-3 md:p-4">
                      <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase mb-1">
                        <CalendarBlank size={14} weight="duotone" />
                        Data
                      </div>
                      <p className="text-sm md:text-lg font-bold">{formatTripDate(reservation.trip_date)}</p>
                    </div>
                    <div className="rounded-2xl bg-muted/20 p-3 md:p-4">
                      <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase mb-1">
                        <Clock size={14} weight="duotone" />
                        Partida
                      </div>
                      <p className="text-sm md:text-lg font-bold">{reservation.departure_time}</p>
                    </div>
                    <div className="rounded-2xl bg-muted/20 p-3 md:p-4">
                      <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase mb-1">
                        <MapPin size={14} weight="duotone" />
                        Origem
                      </div>
                      <p className="text-sm md:text-lg font-bold">{reservation.origin}</p>
                    </div>
                    <div className="rounded-2xl bg-muted/20 p-3 md:p-4">
                      <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase mb-1">
                        <MapPin size={14} weight="duotone" />
                        Destino
                      </div>
                      <p className="text-sm md:text-lg font-bold">{reservation.destiny}</p>
                    </div>
                    <div className="rounded-2xl bg-muted/20 p-3 md:p-4">
                      <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase mb-1">
                        <Clock size={14} weight="duotone" />
                        Chegada
                      </div>
                      <p className="text-sm md:text-lg font-bold">{reservation.arrival_time}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-2xl bg-muted/20 p-3 md:p-4">
                      <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase mb-2">
                        <IdentificationBadge size={14} weight="duotone" />
                        Status da viagem
                      </div>
                      <p className="text-sm md:text-lg font-bold">{reservation.status_trip}</p>
                    </div>
                    <div className="rounded-2xl bg-muted/20 p-3 md:p-4">
                      <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase mb-2">
                        <IdentificationBadge size={14} weight="duotone" />
                        Reserva
                      </div>
                      <StatusBadge status={reservation.reservation_status} />
                    </div>
                    <div className="rounded-2xl bg-muted/20 p-3 md:p-4">
                      <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase mb-2">
                        <WarningCircle size={14} weight="duotone" />
                        Quorum
                      </div>
                      <QuorumBadge met={reservation.quorum_met} />
                    </div>
                    <div className="rounded-2xl bg-muted/20 p-3 md:p-4">
                      <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase mb-1">
                        <Bus size={14} weight="duotone" />
                        Ônibus
                      </div>
                      <p className="text-sm md:text-lg font-bold">{reservation.bus_number_plate}</p>
                    </div>
                    <div className="rounded-2xl bg-muted/20 p-3 md:p-4">
                      <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase mb-1">
                        <User size={14} weight="duotone" />
                        Motorista
                      </div>
                      <p className="text-sm md:text-lg font-bold">{reservation.driver}</p>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="mb-6 px-2">
                  <p className="text-[10px] md:text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase mb-3">Progresso da viagem</p>
                  <div className="relative h-14">
                    <div className="absolute top-1/2 left-0 right-0 h-2.5 -translate-y-1/2 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-500"
                      style={{ left: `clamp(1.5rem, ${percentage}%, calc(100% - 1.5rem))` }}
                    >
                      <span className="grid size-11 place-items-center rounded-full border border-border bg-card text-primary shadow-sm">
                        <Bus aria-hidden="true" weight="fill" className="size-7" />
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs md:text-sm text-muted-foreground mt-1">
                    <span>{reservation.origin}</span>
                    <span className="font-bold text-primary">{percentage}%</span>
                    <span>{reservation.destiny}</span>
                  </div>
                </div>

                <div
                  className={`grid gap-4 items-stretch ${showMinutesCard ? "md:grid-cols-2" : "md:grid-cols-1"}`}
                >
                  {showMinutesCard && (
                    <div className="rounded-2xl bg-card p-4 shadow-sm border border-border/50">
                      <p className="text-[10px] md:text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                        Minutos restantes
                      </p>
                      <p className="mt-1 text-lg md:text-2xl font-bold">
                        {reservation.minutes_remaining}
                      </p>
                    </div>
                  )}

                  <div className="rounded-2xl bg-card p-4 shadow-sm border border-border/50">
                    <p className="text-[10px] md:text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                      Status da rota
                    </p>
                    <p className="mt-1 text-lg md:text-2xl font-bold">
                      {reservation.status_route}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {reservation.can_cancel && (
              <>
                <div className="flex justify-center sm:justify-start">
                  <Button
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10 border-destructive/20"
                    onClick={() => setCancelDialogOpen(true)}
                  >
                    Cancelar reserva
                  </Button>
                </div>

                <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cancelar reserva</DialogTitle>
                      <DialogDescription>
                        Tem certeza que deseja cancelar esta reserva? Esta ação não pode ser desfeita.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                        Manter reserva
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setCancelDialogOpen(false);
                          handleCancel();
                        }}
                      >
                        Sim, cancelar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}

            {!isTripInProgress && user?.profile_type === "CIVIL-SERVANT" && (
              <GuestForm tripId={reservation.trip_id} onGuestAdded={() => setRefreshKey((old) => old + 1)} />
            )}
          </div>
        ) : (
          <div className="rounded-4xl border border-dashed border-border bg-muted/30 p-4 md:p-8 text-center text-xs md:text-sm text-muted-foreground">
            Nenhuma reserva encontrada.
          </div>
        )}
      </section>
  );
}
