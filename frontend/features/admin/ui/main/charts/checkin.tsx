import { RadialBar, RadialBarChart, PolarGrid } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/lib/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/lib/ui/chart"
import { NativeSelect, NativeSelectOption } from "@/lib/ui/native-select"

export function CheckinStatsCard({
  data,
  onFilterChange,
}: {
  data: { total_checkins: number; without_checkin: number; checkin_rate: number }
  onFilterChange: (value: number) => void
}) {
  const chartData = [{ name: "Check-in", value: data?.checkin_rate, fill: "var(--chart-2)" }]

  return (
    <Card className="rounded-xl p-5">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-0">
        <CardTitle className="text-base">Taxa de Check-in</CardTitle>
        <NativeSelect onChange={(e) => onFilterChange(Number(e.target.value))} className="h-8 text-xs">
          <NativeSelectOption value="7">Ultimos 7 dias</NativeSelectOption>
          <NativeSelectOption value="15">Ultimos 15 dias</NativeSelectOption>
          <NativeSelectOption value="30">Ultimos 30 dias</NativeSelectOption>
        </NativeSelect>
      </CardHeader>
      <CardContent className="flex flex-col lg:flex-row gap-6 items-center justify-between p-0 mt-4">
        <div className="grid grid-cols-2 gap-3 w-full">
          <div className="rounded-lg border p-4">
            <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Check-ins</p>
            <p className="mt-2 text-2xl font-bold text-chart-4">{data?.total_checkins}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Sem check-in</p>
            <p className="mt-2 text-2xl font-bold text-primary">{data?.without_checkin}</p>
          </div>
        </div>
        <ChartContainer config={{ value: { label: "Check-in" } }} className="mx-auto aspect-square h-55">
          <RadialBarChart innerRadius={80} outerRadius={110} data={chartData} startAngle={90} endAngle={-270}>
            <PolarGrid gridType="circle" radialLines={false} stroke="none" className="first:fill-muted last:fill-background" polarRadius={[86, 74]} />
            <RadialBar dataKey="value" background cornerRadius={12} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground">
              <tspan x="50%" dy="-0.2em" className="text-3xl font-bold">{data?.checkin_rate}%</tspan>
              <tspan x="50%" dy="1.5em" className="text-sm fill-muted-foreground">taxa</tspan>
            </text>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
