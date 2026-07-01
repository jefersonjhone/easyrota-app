import { CartesianGrid, Line, LineChart, BarChart, Bar, XAxis, YAxis, LabelList } from "recharts"
import { NativeSelect, NativeSelectOption } from "@/lib/ui/native-select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/lib/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/lib/ui/chart"

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function ChartLineDefault({
  chartData,
  onFilterChange,
}: {
  chartData: Array<{ trip_date: string; total: number }>
  onFilterChange?: (value: number) => void
}) {
  return (
    <Card className="rounded-xl p-5">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-0">
        <CardTitle className="text-base">Historico de Viagens</CardTitle>
        <NativeSelect onChange={(e) => onFilterChange?.(Number(e.target.value))} className="h-8 text-xs">
          <NativeSelectOption value="7">Ultimos 7 dias</NativeSelectOption>
          <NativeSelectOption value="30">Ultimos 30 dias</NativeSelectOption>
          <NativeSelectOption value="90">Ultimos 90 dias</NativeSelectOption>
        </NativeSelect>
      </CardHeader>
      <CardContent className="p-0 mt-4">
        <ChartContainer config={chartConfig}>
          <LineChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tickMargin={10} width={20} />
            <XAxis dataKey="trip_date" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => value.length > 10 ? value.slice(0, 10) : value} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Line type="monotone" dataKey="total" stroke="var(--chart-3)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="p-0 mt-3">
        <p className="text-xs text-muted-foreground">Total de viagens registradas no periodo</p>
      </CardFooter>
    </Card>
  )
}

export function ChartBarMixed({ chartData, onFilterChange }: {
  chartData: { days: number; total_trips: number; trips: Array<{ label: string; value: number }> }
  onFilterChange: (value: number) => void
}) {
  return (
    <Card className="rounded-xl p-5">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-0">
        <CardTitle className="text-base">Viagens por Status</CardTitle>
        <NativeSelect onChange={(e) => onFilterChange(Number(e.target.value))} className="h-8 text-xs">
          <NativeSelectOption value="7">Ultimos 7 dias</NativeSelectOption>
          <NativeSelectOption value="30">Ultimos 30 dias</NativeSelectOption>
          <NativeSelectOption value="90">Ultimos 90 dias</NativeSelectOption>
        </NativeSelect>
      </CardHeader>
      <CardDescription className="p-0 mt-1 text-xs">Contagem de viagens divididas por status</CardDescription>
      <CardContent className="p-0 mt-4">
        <ChartContainer config={{}}>
          <BarChart accessibilityLayer data={chartData?.trips} layout="vertical" margin={{ left: 40 }}>
            <YAxis dataKey="label" type="category" tickLine={false} tickMargin={10} axisLine={false} />
            <XAxis dataKey="value" type="number" hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="value" radius={6} fill="var(--chart-4)">
              <LabelList dataKey="value" position="right" offset={-16} className="fill-white font-black" fontSize={12} />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-1 p-0 mt-3">
        <p className="text-xs font-medium text-chart-4">Total de viagens: {chartData?.total_trips}</p>
        <p className="text-xs text-muted-foreground">Ultimos {chartData?.days} dias</p>
      </CardFooter>
    </Card>
  )
}
