import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/lib/ui/card"
import { NativeSelect, NativeSelectOption } from "@/lib/ui/native-select"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/lib/ui/table"
import type { TripsByRoute } from "@/features/admin/hooks/dashboard/useTripsByRoute"

function formatTime(time: string) {
  return time.split(".")[0]
}

export function TripsTable({ data, onFilterChange }: { data: TripsByRoute; onFilterChange: (days: number) => void }) {
  return (
    <Card className="rounded-xl p-5">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-0">
        <CardTitle className="text-base">Viagens por Rota</CardTitle>
        <NativeSelect onChange={(e) => onFilterChange(Number(e.target.value))} className="h-8 text-xs">
          <NativeSelectOption value="7">Ultimos 7 dias</NativeSelectOption>
          <NativeSelectOption value="30">Ultimos 30 dias</NativeSelectOption>
          <NativeSelectOption value="90">Ultimos 90 dias</NativeSelectOption>
        </NativeSelect>
      </CardHeader>
      <CardContent className="p-0 mt-4">
        <Table>
          <TableCaption>Total de {data?.reduce((sum, t) => sum + t.total_trips, 0)} viagens cadastradas</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-xs">Rota</TableHead>
              <TableHead className="text-xs">Origem</TableHead>
              <TableHead className="text-xs">Destino</TableHead>
              <TableHead className="text-right text-xs">Viagens</TableHead>
              <TableHead className="text-right text-xs">Horario</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((trip) => (
              <TableRow key={trip.route_id}>
                <TableCell className="font-medium text-xs">{trip.route_id}</TableCell>
                <TableCell className="capitalize text-xs">{trip.origin}</TableCell>
                <TableCell className="capitalize text-xs">{trip.destiny}</TableCell>
                <TableCell className="text-right text-xs">{trip.total_trips}</TableCell>
                <TableCell className="text-right text-xs">{formatTime(trip.departure_time)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="p-0 mt-3">
        <p className="text-xs text-muted-foreground">Exibindo {data?.length} rotas</p>
      </CardFooter>
    </Card>
  )
}
