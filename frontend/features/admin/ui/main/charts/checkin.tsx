import {
  RadialBar,
  RadialBarChart,
  PolarGrid,
} from "recharts"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/lib/ui/card"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/lib/ui/chart"

import {
            NativeSelect,
            NativeSelectOption,
          } from "@/lib/ui/native-select"
          
export function CheckinStatsCard({
  data,
  onFilterChange,
}: {
  data: {
    total_checkins: number
    without_checkin: number
    checkin_rate: number
  }
  onFilterChange: (value: number) => void
}) {
  const chartData = [
    {
      name: "Check-in",
      value: data?.checkin_rate,
      fill: "var(--chart-2)",
    },
  ]

  return (
    <Card className="rounded-sm">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>
          Taxa de Check-in
        </CardTitle>
        <NativeSelect className="rounded-sm bg-gray-200" onChange={(e) => onFilterChange(Number(e.target.value))}>
                    <NativeSelectOption value="7">Últimos 7 dias</NativeSelectOption>
                    <NativeSelectOption value="15">Últimos 15 dias</NativeSelectOption>
                    <NativeSelectOption value="30">Últimos 30 dias</NativeSelectOption>
                  </NativeSelect>
      </CardHeader>

      <CardContent className="flex flex-col lg:flex-row gap-6 items-center justify-between">
        
        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="border rounded-md p-4">
            <p className="text-sm text-muted-foreground">
              Check-ins
            </p>

            <h2 className="text-3xl font-bold text-chart-4">
              {data?.total_checkins}
            </h2>
          </div>

          <div className="border rounded-md p-4 ">
            <p className="text-sm text-muted-foreground">
              Sem check-in
            </p>

            <h2 className="text-3xl font-bold text-primary ">
              {data?.without_checkin}
            </h2>
          </div>
        </div>

        <ChartContainer
          config={{
            value: {
              label: "Check-in",
            },
          }}
          className="mx-auto aspect-square h-55"
        >
          <RadialBarChart
            innerRadius={80}
            outerRadius={110}
            data={chartData}
            startAngle={90}
            endAngle={-270}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted last:fill-background"
              polarRadius={[86, 74]}
            />

            <RadialBar
              dataKey="value"
              background
              cornerRadius={12}
            />

            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent />}
            />

            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground"
            >
              <tspan
                x="50%"
                dy="-0.2em"
                className="text-3xl font-bold"
              >
                {data?.checkin_rate}%
              </tspan>

              <tspan
                x="50%"
                dy="1.5em"
                className="text-sm fill-muted-foreground"
              >
                taxa
              </tspan>
            </text>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}