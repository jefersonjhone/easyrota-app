import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Button } from "@ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ui/card";
import {
  ArrowLeft,
  CalendarBlank,
  Clock,
  Bus,
  CheckCircle,
  WarningCircle,
  MapPin,
  Timer,
} from "@phosphor-icons/react";
import { getStatusTone } from "../config";
import {
  createReservation,
  fetchTripById,
} from "../services/reservations";
import type { AvailableTrip } from "../types";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
};

export function TripDetailPage() {
  const { id } = useParams({ from: "/app/viagens/$id" });
  const [trip, setTrip] = useState<AvailableTrip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReserving, setIsReserving] = useState(false);
  const [reserved, setReserved] = useState(false);
  const [justReserved, setJustReserved] = useState(false);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(t);
  }, [error]);

  const loadTrip = useCallback(() => {
    setIsLoading(true);
    fetchTripById(id)
      .then((data) => {
        setTrip(data);
        if (data.user_is_reserved) setReserved(true);
      })
      .catch((err) => {
        const errorData = err as { data?: { detail?: string } } | undefined;
        setError(
          errorData?.data?.detail ||
            "Não foi possível carregar os dados da viagem.",
        );
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    loadTrip();
  }, [loadTrip]);

  const handleReserve = async () => {
    if (!trip) return;
    setIsReserving(true);
    setError(null);
    try {
      await createReservation(trip.id);
      setReserved(true);
      setJustReserved(true);
      loadTrip();
    } catch (err) {
      const errorData = err as { data?: { detail?: string } } | undefined;
      setError(
        errorData?.data?.detail ||
          "Não foi possível reservar esta viagem.",
      );
    } finally {
      setIsReserving(false);
    }
  };

  const studentsCount =
    (trip?.reserved_seats ?? 0) - (trip?.server_reserved_seats ?? 0);
  const servantsCount = trip?.server_reserved_seats ?? 0;

  if (isLoading) {
    return (
      <section className="mx-auto w-full max-w-4xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-4xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground"
        >
          Carregando detalhes da viagem...
        </motion.div>
      </section>
    );
  }

  if (error && !trip) {
    return (
      <section className="mx-auto w-full max-w-4xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-4xl border border-dashed border-border bg-muted/30 p-8 text-center"
        >
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">
                Viagem não encontrada
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {error ||
                  "Esta viagem pode não estar mais disponível."}
              </p>
            </div>
            <Link to="/app/viagens">
              <Button variant="outline">
                <ArrowLeft size={14} />
                Voltar
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    );
  }

  if (!trip) return null;

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-8">
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0 }}>
        <Link
          to="/app/viagens"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          Voltar para viagens
        </Link>
      </motion.div>

      <motion.div
        className="mb-6 mt-4 space-y-2"
        {...fadeUp}
        transition={{ ...fadeUp.transition, delay: 0.05 }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-primary uppercase">
            Viagem disponível
          </span>
          {reserved && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
              <CheckCircle size={12} weight="fill" />
              Reservado
            </span>
          )}
        </div>
        <h1 className="font-heading text-2xl md:text-4xl font-semibold tracking-tight">
          {trip.origin} &rarr; {trip.destiny}
        </h1>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </motion.div>
      )}

      {justReserved && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6"
        >
          <Card className="rounded-xl border border-emerald-500/30 bg-emerald-500/5">
            <CardContent className="flex flex-col items-center justify-center gap-4 py-8">
              <span className="grid size-14 place-items-center rounded-full bg-emerald-500/10">
                <CheckCircle
                  size={28}
                  weight="fill"
                  className="text-emerald-600"
                />
              </span>
              <div className="text-center">
                <p className="text-lg font-bold text-emerald-700">
                  Reserva confirmada
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sua vaga no trajeto {trip.origin} &rarr; {trip.destiny} foi
                  garantida.
                </p>
              </div>
              <Link to="/app/reservas">
                <Button variant="outline" size="sm">
                  Ver minhas reservas
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.1 }}
        >
          <Card className="rounded-xl border border-border/70 bg-card">
            <CardHeader className="border-b border-border/70 pb-5">
              <CardTitle className="text-lg">
                Informações da viagem
              </CardTitle>
              <CardDescription className="text-sm">
                Dados operacionais do trajeto.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <InfoCell
                  icon={<CalendarBlank size={14} weight="duotone" />}
                  label="Data"
                  value={trip.trip_date}
                />
                <InfoCell
                  icon={<Clock size={14} weight="duotone" />}
                  label="Horário"
                  value={trip.departure_time}
                />
                <InfoCell
                  icon={<MapPin size={14} weight="duotone" />}
                  label="Origem"
                  value={trip.origin}
                />
                <InfoCell
                  icon={<MapPin size={14} weight="duotone" />}
                  label="Destino"
                  value={trip.destiny}
                />
                <InfoCell
                  icon={<Bus size={14} weight="duotone" />}
                  label="Ônibus"
                  value={trip.bus_brand}
                />
                <InfoCell
                  icon={<Timer size={14} weight="duotone" />}
                  label="Disponíveis"
                  value={trip.available_seats}
                />
              </div>

              <div className="rounded-2xl bg-muted/20 p-4 space-y-3">
                <p className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                  Ocupação
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Alunos
                    </span>
                    <span className="text-sm font-bold">{studentsCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Servidores
                    </span>
                    <span className="text-sm font-bold">{servantsCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Disponíveis
                    </span>
                    <span className="text-sm font-bold">
                      {trip.available_seats}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className="space-y-6"
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.15 }}
        >
          <Card className="rounded-xl border border-border/70 bg-card">
            <CardHeader className="border-b border-border/70 pb-5">
              <CardTitle className="text-lg">Reserva</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="rounded-2xl bg-muted/20 p-4">
                <p className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase mb-1">
                  Status da viagem
                </p>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase ring-1 ${getStatusTone(trip.status_trip)}`}
                >
                  {trip.status_trip}
                </span>
              </div>

              {trip.quorum_met !== undefined && (
                <div className="rounded-2xl bg-muted/20 p-4">
                  <p className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase mb-1">
                    Quórum
                  </p>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase ring-1 ${
                      trip.quorum_met
                        ? "bg-emerald-500/10 text-emerald-700 ring-emerald-600/20"
                        : "bg-amber-500/10 text-amber-700 ring-amber-600/20"
                    }`}
                  >
                    {trip.quorum_met ? (
                      <CheckCircle size={12} weight="fill" />
                    ) : (
                      <WarningCircle size={12} weight="fill" />
                    )}
                    {trip.quorum_met ? "Atingido" : "Pendente"}
                  </span>
                </div>
              )}

              {trip.reservation_deadline && (
                <div className="rounded-2xl bg-muted/20 p-4">
                  <p className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase mb-1">
                    Limite para reserva
                  </p>
                  <p className="text-sm font-bold">
                    {new Date(trip.reservation_deadline).toLocaleString('pt-BR')}
                  </p>
                </div>
              )}

              <Button
                className="w-full"
                disabled={
                  !trip.is_reservable || isReserving || reserved
                }
                onClick={handleReserve}
              >
                {reserved ? (
                  <>
                    <CheckCircle size={16} />
                    Reservado
                  </>
                ) : isReserving ? (
                  "Reservando..."
                ) : trip.is_reservable ? (
                  "Reservar"
                ) : (
                  "Indisponível"
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

function InfoCell({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-muted/20 p-4">
      <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase mb-1">
        {icon}
        {label}
      </div>
      <p className="text-sm md:text-base font-bold text-foreground">{value}</p>
    </div>
  );
}
