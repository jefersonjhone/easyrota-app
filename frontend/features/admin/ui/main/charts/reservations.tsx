import { Card, CardContent, CardHeader, CardTitle } from "@/lib/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/lib/ui/table"
import { NativeSelect, NativeSelectOption } from "@/lib/ui/native-select"

export function MostReservedTripsTable({
  data,
  onFilterChange,
}: {
  data: { trip__id: string; trip__route__origin: string; trip__route__destiny: string; trip__trip_date: string; total_reservations: number }[]
  onFilterChange: (value: number) => void
}) {
  return (
    <Card className="rounded-xl p-5">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-0">
        <CardTitle className="text-base">Viagens Mais Reservadas</CardTitle>
        <NativeSelect onChange={(e) => onFilterChange(Number(e.target.value))} className="h-8 text-xs">
          <NativeSelectOption value="7">Ultimos 7 dias</NativeSelectOption>
          <NativeSelectOption value="15">Ultimos 15 dias</NativeSelectOption>
          <NativeSelectOption value="30">Ultimos 30 dias</NativeSelectOption>
        </NativeSelect>
      </CardHeader>
      <CardContent className="p-0 mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Rota</TableHead>
              <TableHead className="text-xs">Data</TableHead>
              <TableHead className="text-right text-xs">Reservas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((item) => (
              <TableRow key={item.trip__id}>
                <TableCell className="font-medium text-xs">{item.trip__route__origin} {" → "} {item.trip__route__destiny}</TableCell>
                <TableCell className="text-xs">{new Date(item.trip__trip_date).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell className="text-right font-bold text-xs">{item.total_reservations}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
