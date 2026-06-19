import type { ProfileUser } from "@/features/user-home/types";

const InfoCard = ({ title, value, variant = "default" }: { title: string; value: number; variant?: "default" | "danger" }) => {
  const isDangerActive = variant === "danger" && value > 0;

  return (
    <div className={`rounded-4xl border p-3 md:p-5 shadow-sm ${
      isDangerActive
        ? "border-destructive/20 bg-destructive/5"
        : "border-border/70 bg-card/95"
    }`}>
      <p className={`text-[10px] md:text-xs font-semibold tracking-[0.2em] uppercase ${
        isDangerActive ? "text-destructive" : "text-muted-foreground"
      }`}>
        {title}
      </p>
      <p className={`mt-1.5 md:mt-3 text-xl md:text-3xl font-semibold tracking-tight ${
        isDangerActive ? "text-destructive" : "text-foreground"
      }`}>
        {value}
      </p>
    </div>
  )
}

export const ProfileStats = ({ user }: { user: ProfileUser }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
      <InfoCard title="Reservas ativas" value={user.active_reservations} />
      <InfoCard title="Viagens realizadas" value={user.checkins_count} />
      <InfoCard title="Reservas solicitadas" value={user.reservations_count} />
      <InfoCard title="Penalidades ativas" value={user.active_punishments ?? 0} variant="danger" />
    </div>
  );
};
