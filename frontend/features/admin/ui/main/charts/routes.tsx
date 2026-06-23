import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/lib/ui/card"

import {
            NativeSelect,
  NativeSelectOption,
} from "@/lib/ui/native-select"


import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/lib/ui/table"

import type { TripsByRoute } from "@/features/admin/hooks/dashboard/useTripsByRoute"

function formatTime(time: string) {
  return time.split(".")[0] // "12:00:00"
}

export function TripsTable({ data, onFilterChange }: { data: TripsByRoute; onFilterChange: (days: number) => void }) {
  
  return (
    <Card className="rounded-lg">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <CardTitle>Tabela de Viagens Por Rota </CardTitle>
        <NativeSelect onChange={(e) => onFilterChange(Number(e.target.value))}>
                        <NativeSelectOption  value="7">Últimos 7 dias</NativeSelectOption>
                        <NativeSelectOption value="30">Últimos 30 dias</NativeSelectOption>
                        <NativeSelectOption value="90">Últimos 90 dias</NativeSelectOption>
                      </NativeSelect>
      </CardHeader>
      <CardContent>
        <Table className="table-auto w-32 sm:w-full">
          <TableCaption>Total de {data?.reduce((sum, t) => sum + t.total_trips, 0)} viagens cadastradas</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="md:w-20">Rota ID</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead className="text-right">Viagens</TableHead>
              <TableHead className="text-right">Horário</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((trip) => (
              <TableRow key={trip.route_id}>
                <TableCell className="font-medium">{trip.route_id}</TableCell>
                <TableCell className="capitalize">{trip.origin}</TableCell>
                <TableCell className="capitalize">{trip.destiny}</TableCell>
                <TableCell className="text-right">{trip.total_trips}</TableCell>
                <TableCell className="text-right">{formatTime(trip.departure_time)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        Exibindo {data?.length} rotas
      </CardFooter>
    </Card>
  )
}