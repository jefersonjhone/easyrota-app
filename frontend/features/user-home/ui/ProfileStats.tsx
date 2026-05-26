import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/lib/ui/card";
import type { ProfileUser } from "@/features/user-home/types";

const InfoCard = ({ title, value }: { title: string; value: number;}) => {
  return (
    <Card className="cursor-pointer hover:shadow-md transition group rounded-sm 
      gap-1
      p-1 pt-2 md:p-4 shadow-sm border-none  ">
      <CardHeader className="flex items-center justify-between space-y-0 p-0 m-0">
        <CardTitle className="text-xs md:text-sm font-semibold text-center w-full ">
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
    <div className="grid grid-cols-3 gap-1 mt-2 mb-6 md:gap-4 p-0 h-16 md:h-22 px-2 sm:px-0">
      <InfoCard title="Reservas ativas" value={user.active_reservations} />
      <InfoCard title="Viagens realizadas" value={user.checkins_count} />
      <InfoCard title="Reservas solicitadas" value={user.reservations_count} />
    </div>
 );
};