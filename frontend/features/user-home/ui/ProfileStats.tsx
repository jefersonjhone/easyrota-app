import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/lib/ui/card";
import type { ProfileUser } from "@/features/user-home/types";

const InfoCard = ({ title, value, variant = "default" }: { title: string; value: number; variant?: "default" | "danger";}) => {
  const isDangerActive = variant === "danger" && value > 0;

  return (
    <Card className={`cursor-pointer hover:shadow-md transition group rounded-sm gap-1 p-1 pt-2 md:p-4 shadow-sm 
      ${isDangerActive ? "bg-red-50 border border-red-200" : "border-none"}`}>
      <CardHeader className="flex items-center justify-between space-y-0 p-0 m-0">
        <CardTitle className={`text-xs md:text-sm font-semibold text-center w-full 
          ${isDangerActive ? "text-red-700" : ""}`}>
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="text-center p-0 m-0">
        <div className="flex items-center justify-center">
          <div className="text-xl font-bold ">{value}</div>
        </div>
      </CardContent>
    </Card>
  )
}
export const ProfileStats = ({ user }: { user: ProfileUser }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 mb-6 md:gap-4 p-0 px-2 sm:px-0">
      <InfoCard title="Reservas ativas" value={user.active_reservations} />
      <InfoCard title="Viagens realizadas" value={user.checkins_count} />
      <InfoCard title="Reservas solicitadas" value={user.reservations_count} />
      <InfoCard title="Penalidades ativas" value={user.active_punishments ?? 0} variant="danger" />
    </div>
 );
};