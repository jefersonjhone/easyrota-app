import { CartesianGrid,  } from "recharts"
import {
            NativeSelect,
            NativeSelectOption,
          } from "@/lib/ui/native-select"
          

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/lib/ui/card"



import { Line, LineChart, BarChart, Bar, XAxis, YAxis, LabelList } from "recharts"
import {
  CardFooter,
} from "@/lib/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  
  ChartTooltipContent,
  type ChartConfig,
} from "@/lib/ui/chart"



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
    <Card className="rounded-lg">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <CardTitle>
          Histórico de Viagens Registradas
        </CardTitle>

        <NativeSelect
          onChange={(e) => {
            onFilterChange?.(Number(e.target.value))
          }}
        >
          <NativeSelectOption value="7">
            Últimos 7 dias
          </NativeSelectOption>

          <NativeSelectOption value="30">
            Últimos 30 dias
          </NativeSelectOption>

          <NativeSelectOption value="90">
            Últimos 90 dias
          </NativeSelectOption>
        </NativeSelect>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData}
          >
            <CartesianGrid vertical={false} />
            <YAxis
              allowDecimals={false} 
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              width={20}
            />
            <XAxis
              dataKey="trip_date"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) =>
                value.length > 10
                  ? value.slice(0, 10)
                  : value
              }
            />

            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />

            <Line
              type="monotone"
              dataKey="total"
              stroke="var(--chart-3)"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>

      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="leading-none text-muted-foreground">
          Total de viagens nos últimos dias
        </div>
      </CardFooter>
    </Card>
  )
}



export function ChartBarMixed(
  { chartData, onFilterChange, }: {
    chartData: {
      days: number;
      total_trips: number;
      trips: Array<{ label: string; value: number }>
    };
    onFilterChange: (value: number) => void
  }) {

  return (
    <Card className="rounded-lg">
      <CardHeader className="flex flex-col">
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-2">
          <CardTitle>Viagens por Status</CardTitle>

          <NativeSelect
            onChange={(e) => {
              onFilterChange(Number(e.target.value))
            }}
          >
            <NativeSelectOption value="7">
              Últimos 7 dias
            </NativeSelectOption>

            <NativeSelectOption value="30">
              Últimos 30 dias
            </NativeSelectOption>

            <NativeSelectOption value="90">
              Últimos 90 dias
            </NativeSelectOption>
          </NativeSelect>
        </div>

        <CardDescription>
          Contagem de viagens divididas por status
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer config={{}}>
          <BarChart
            accessibilityLayer
            data={chartData?.trips}
            layout="vertical"
            margin={{ left: 40 }}
          >
            <YAxis
              dataKey="label"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />

            <XAxis
              dataKey="value"
              type="number"
              hide
            />

            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />

            <Bar
              dataKey="value"
              radius={6}
              fill="var(--chart-4)"
            >
              <LabelList
                dataKey="value"
                position="right"
                offset={-16}
                className="fill-white font-black "
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>

      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="leading-none font-medium text-chart-4">
          Total de viagens: {chartData?.total_trips}
        </div>

        <div className="text-muted-foreground">
          Últimos {chartData?.days} dias
        </div>
      </CardFooter>
    </Card>
  )
}