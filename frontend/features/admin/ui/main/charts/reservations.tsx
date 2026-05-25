import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/lib/ui/card"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/lib/ui/table"

import {
            NativeSelect,
            NativeSelectOption,
          } from "@/lib/ui/native-select"

          
export function MostReservedTripsTable({
  data,
  onFilterChange,
}: {
    data: {
      trip__id: string,
      trip__route__origin: string,
      trip__route__destiny: string,
      trip__trip_date: string,
      total_reservations: number
    }[]
  onFilterChange: (value: number) => void
}) {
  return (
    <Card className="rounded-sm">
      <CardHeader className="flex justify-between items-center">
        <CardTitle>
          Viagens Mais Reservadas
        </CardTitle>
        <NativeSelect className="rounded-sm bg-gray-200" onChange={(e) => onFilterChange(Number(e.target.value))}>
               <NativeSelectOption value="7">Últimos 7 dias</NativeSelectOption>
               <NativeSelectOption value="15">Últimos 15 dias</NativeSelectOption>
               <NativeSelectOption value="30">Últimos 30 dias</NativeSelectOption>
             </NativeSelect>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rota</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">
                Reservas
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data?.map((item) => (
              <TableRow key={item.trip__id}>
                <TableCell className="font-medium">
                  {item.trip__route__origin}
                  {" → "}
                  {item.trip__route__destiny}
                </TableCell>

                <TableCell>
                  {new Date(
                    item.trip__trip_date
                  ).toLocaleDateString("pt-BR")}
                </TableCell>

                <TableCell className="text-right font-bold">
                  {item.total_reservations}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}